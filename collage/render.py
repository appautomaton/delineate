"""Render a sculpture's scan into the passes Collage draws from: a beauty image and three fields.

Blender's own Python runs it, headless; collage/render.ts (npm run collage:render) writes the JSON.
Run: blender -b -P collage/render.py -- '<json>'
JSON keys:
  mesh      path to .stl / .obj
  out       output directory
  fix       [rx, ry, rz] degrees applied after import, to stand the scan upright (Z up)
  views     list of [azimuth, elevation] degrees; azimuth 0 looks from -Y toward +Y
  mode      "preview" (workbench, small, one PNG per view, to choose a view) or "final" (the first view)
  long      long side in px
  lens      focal length in mm
  key_side  -1 keys from the left, +1 from the right: the side the subject faces
  samples   Cycles samples for the beauty and tone renders
Final writes beauty.png (the object in ivory, on nothing), tone.png, depth.png and normal.png (both 16-bit), and
view.json.
"""
import bpy, sys, json, math, os
import numpy as np
from mathutils import Vector, Euler

cfg = json.loads(sys.argv[sys.argv.index("--") + 1])
out = cfg["out"]; os.makedirs(out, exist_ok=True)
mode = cfg.get("mode", "preview")
lens = cfg.get("lens", 85)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- import ----------
path = cfg["mesh"]
if path.lower().endswith(".stl"):
    bpy.ops.wm.stl_import(filepath=path)
else:
    bpy.ops.wm.obj_import(filepath=path)
objs = [o for o in scene.objects if o.type == "MESH"]
bpy.ops.object.select_all(action="DESELECT")
for o in objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
if len(objs) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
fx = [math.radians(a) for a in cfg.get("fix", [0, 0, 0])]
obj.rotation_euler = Euler(fx, "XYZ")
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

me = obj.data
n = len(me.vertices)
co = np.empty(n * 3, dtype=np.float64); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
lo, hi = co.min(0), co.max(0)
center = (lo + hi) / 2
height = hi[2] - lo[2]
# Normalise: base at z=0, centred in xy, 2 units tall.
s = 2.0 / height
co = (co - np.array([center[0], center[1], lo[2]])) * s
me.vertices.foreach_set("co", co.ravel())
me.update()
me.polygons.foreach_set("use_smooth", np.ones(len(me.polygons), dtype=bool))
for poly_attr in ("sharp_face",):
    if poly_attr in me.attributes:
        me.attributes.remove(me.attributes[poly_attr])
me.update()
tris = sum(len(p.vertices) - 2 for p in me.polygons)
ext = co.max(0) - co.min(0)

# Subsample of vertices for framing.
step = max(1, n // 200000)
pts = co[::step]

# ---------- camera ----------
cam_data = bpy.data.cameras.new("cam"); cam_data.lens = lens; cam_data.sensor_width = 36; cam_data.sensor_height = 36
cam = bpy.data.objects.new("cam", cam_data); scene.collection.objects.link(cam); scene.camera = cam
target = Vector((0, 0, ext[2] / 2))


def frame(az, el, long_px, margin=0.06):
    """Aim the camera from (az, el), then size distance, shift and aspect to fit the silhouette."""
    a, e = math.radians(az), math.radians(el)
    d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    rot = (-d).to_track_quat("-Z", "Y")
    cam.rotation_euler = rot.to_euler()
    R = np.array(rot.to_matrix())  # camera axes in world (columns)
    dist = 8.0
    for _ in range(4):
        pos = np.array(target + d * dist)
        local = (pts - pos) @ R  # camera space
        z = -local[:, 2]
        x = local[:, 0] / z; y = local[:, 1] / z
        x0, x1, y0, y1 = x.min(), x.max(), y.min(), y.max()
        w, h = x1 - x0, y1 - y0
        fov = 36 / lens  # tan-space width of the sensor
        need = max(w, h) * (1 + 2 * margin)
        dist *= need / fov
    pos = np.array(target + d * dist)
    local = (pts - pos) @ R; z = -local[:, 2]
    x = local[:, 0] / z; y = local[:, 1] / z
    x0, x1, y0, y1 = x.min(), x.max(), y.min(), y.max()
    w, h = (x1 - x0) * (1 + 2 * margin), (y1 - y0) * (1 + 2 * margin)
    cam.location = Vector(pos)
    if w >= h:
        scene.render.resolution_x = long_px; scene.render.resolution_y = int(round(long_px * h / w))
        cam_data.sensor_fit = "HORIZONTAL"; cam_data.lens = 36 / w
    else:
        scene.render.resolution_y = long_px; scene.render.resolution_x = int(round(long_px * w / h))
        cam_data.sensor_fit = "VERTICAL"; cam_data.lens = 36 / h
    span = max(w, h)
    cam_data.shift_x = ((x0 + x1) / 2) / span
    cam_data.shift_y = ((y0 + y1) / 2) / span
    cam_data.clip_start = max(0.01, z.min() * 0.5); cam_data.clip_end = z.max() * 2
    return float(z.min()), float(z.max()), d


scene.render.resolution_percentage = 100

if mode == "preview":
    scene.render.engine = "BLENDER_WORKBENCH"
    sh = scene.display.shading
    sh.light = "STUDIO"; sh.color_type = "SINGLE"; sh.single_color = (0.8, 0.8, 0.8)
    sh.show_cavity = True
    scene.render.film_transparent = False
    world = bpy.data.worlds.new("w"); scene.world = world
    scene.render.image_settings.file_format = "PNG"
    for az, el in cfg["views"]:
        frame(az, el, cfg.get("long", 360))
        scene.render.filepath = os.path.join(out, f"az{int(az):03d}_el{int(el):+03d}.png")
        bpy.ops.render.render(write_still=True)
    sys.exit(0)

# ---------- final ----------
az, el = cfg["views"][0]
long_px = cfg.get("long", 1200)
zmin, zmax, vdir = frame(az, el, long_px)

scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "METAL"; prefs.get_devices()
    for dev in prefs.devices:
        dev.use = True
    scene.cycles.device = "GPU"
except Exception as ex:
    print("GPU unavailable:", ex)
scene.cycles.use_denoising = True
scene.render.image_settings.file_format = "PNG"

bpy.context.view_layer.update()  # matrix_world is stale until the depsgraph updates
R_cam = cam.matrix_world.to_3x3()
cam_right = Vector(R_cam.col[0]); cam_up = Vector(R_cam.col[1])
cam_back = Vector(R_cam.col[2])  # points from subject toward camera


def area(name, energy, size, direction_world, dist=6.0, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = energy; ld.size = size; ld.color = color
    lo_ = bpy.data.objects.new(name, ld); scene.collection.objects.link(lo_)
    p = target + direction_world.normalized() * dist
    lo_.location = p
    lo_.rotation_euler = (target - p).to_track_quat("-Z", "Y").to_euler()
    return lo_


def clear_lights():
    for o in [o for o in scene.objects if o.type == "LIGHT"]:
        bpy.data.objects.remove(o, do_unlink=True)


def world(color, strength):
    w = bpy.data.worlds.new("w"); w.use_nodes = True
    bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (*color, 1); bg.inputs[1].default_value = strength
    scene.world = w


def set_material(mat):
    obj.data.materials.clear(); obj.data.materials.append(mat)


def render(name, view, depth16=False, transparent=True):
    scene.view_settings.view_transform = view
    scene.view_settings.look = "None"
    scene.render.film_transparent = transparent
    scene.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    scene.render.image_settings.color_depth = "16" if depth16 else "8"
    scene.render.filepath = os.path.join(out, f"{name}.png")
    bpy.ops.render.render(write_still=True)


# Lights are placed in camera terms, so they read the same whatever the azimuth.
# key_side -1 keys from the left, +1 from the right: the side the subject faces.
ks = cfg.get("key_side", -1)
key_dir = (ks * 1.0 * cam_right + 0.9 * cam_up + 0.6 * cam_back)
fill_dir = (-ks * 0.9 * cam_right + 0.1 * cam_up + 0.8 * cam_back)
rim_dir = (-ks * 0.5 * cam_right + 0.6 * cam_up - 1.0 * cam_back)


def measure(name, view, channel_fn):
    """Render a quarter-size probe, load it back, return the subject's pixels through channel_fn."""
    pct = scene.render.resolution_percentage
    scene.render.resolution_percentage = 25
    render(name + "_probe", view, depth16=True)
    scene.render.resolution_percentage = pct
    path = os.path.join(out, f"{name}_probe.png")
    img = bpy.data.images.load(path); img.colorspace_settings.name = "Non-Color"
    px = np.empty(len(img.pixels), dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
    bpy.data.images.remove(img); os.remove(path)
    return channel_fn(px[px[:, 3] > 0.99])


def srgb_to_lin(v):
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)

# 1. Beauty: the scan itself, cast in warm ivory plaster and cut out on nothing, as a photograph of the object
# would show it: a soft key, a warm fill from the room, a faint rim; the ground transparent.
m = bpy.data.materials.new("ivory"); m.use_nodes = True
b = m.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.70, 0.59, 0.42, 1)
b.inputs["Roughness"].default_value = 0.45
b.inputs["Subsurface Weight"].default_value = 0.2
b.inputs["Subsurface Radius"].default_value = (0.08, 0.05, 0.03)
b.inputs["Subsurface Scale"].default_value = 0.02
set_material(m)
clear_lights(); world((0.92, 0.87, 0.80), 0.10)
area("key", 520, 3.0, key_dir); area("fill", 55, 5.0, fill_dir); area("rim", 120, 1.5, rim_dir)
scene.cycles.samples = cfg.get("samples", 160)
render("beauty", "AgX")

# 2. Tone: diffuse grey, one key, soft fill from the world.
t = bpy.data.materials.new("tone"); t.use_nodes = True
nt = t.node_tree; nt.nodes.clear()
dif = nt.nodes.new("ShaderNodeBsdfDiffuse"); dif.inputs["Color"].default_value = (0.6, 0.6, 0.6, 1)
o_ = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(dif.outputs[0], o_.inputs[0])
set_material(t)
clear_lights(); world((1, 1, 1), 0.15)
area("key", 900, 1.2, key_dir)
# Expose so the brightest lit planes (99th percentile of the subject) land at 0.92 display value.
# The probe runs 3 stops down so nothing clips while measuring.
scene.view_settings.exposure = -3
lit = float(np.percentile(measure("tone", "Standard", lambda p: p[:, 0]), 99))
scene.view_settings.exposure = -3 + float(np.log2(srgb_to_lin(np.array(0.92)) / max(srgb_to_lin(np.array(lit)), 1e-4)))
tone_exposure = scene.view_settings.exposure
render("tone", "Standard")
scene.view_settings.exposure = 0

# 3. Depth and 4. normal: emission fields, Raw view, 16-bit, 1 sample-per-pixel filter only.
scene.cycles.samples = 16
scene.cycles.use_denoising = False
clear_lights(); world((0, 0, 0), 0)


def emission_material(name, build):
    mm = bpy.data.materials.new(name); mm.use_nodes = True
    tree = mm.node_tree; tree.nodes.clear()
    em = tree.nodes.new("ShaderNodeEmission"); outn = tree.nodes.new("ShaderNodeOutputMaterial")
    tree.links.new(em.outputs[0], outn.inputs[0])
    build(tree, em)
    return mm


def build_depth(tree, em):
    cd = tree.nodes.new("ShaderNodeCameraData")
    mr = tree.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = zmin; mr.inputs["From Max"].default_value = zmax
    mr.inputs["To Min"].default_value = 1.0; mr.inputs["To Max"].default_value = 0.0  # near = white
    mr.clamp = True
    tree.links.new(cd.outputs["View Z Depth"], mr.inputs["Value"])
    tree.links.new(mr.outputs["Result"], em.inputs["Color"])


def build_normal(tree, em):
    geo = tree.nodes.new("ShaderNodeNewGeometry")
    vt = tree.nodes.new("ShaderNodeVectorTransform")
    vt.vector_type = "NORMAL"; vt.convert_from = "WORLD"; vt.convert_to = "CAMERA"
    tree.links.new(geo.outputs["Normal"], vt.inputs[0])
    # Blender camera space looks down -Z; flip Z so a normal facing the viewer is +Z (blue).
    mul = tree.nodes.new("ShaderNodeVectorMath"); mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = (0.5, 0.5, -0.5)
    add = tree.nodes.new("ShaderNodeVectorMath"); add.operation = "ADD"
    add.inputs[1].default_value = (0.5, 0.5, 0.5)
    tree.links.new(vt.outputs[0], mul.inputs[0]); tree.links.new(mul.outputs[0], add.inputs[0])
    tree.links.new(add.outputs[0], em.inputs["Color"])


# Probe depth over the full vertex range, then normalise to the range actually seen (0.1/99.9 percentile drops stray pixels).
zall0, zall1 = zmin, zmax
set_material(emission_material("depth", build_depth))
seen = measure("depth", "Raw", lambda p: p[:, 0])
d_hi, d_lo = np.percentile(seen, [99.9, 0.1])  # values: 1 = near
zmin, zmax = zall0 + (1 - d_hi) * (zall1 - zall0), zall0 + (1 - d_lo) * (zall1 - zall0)
set_material(emission_material("depth", build_depth)); render("depth", "Raw", depth16=True)
set_material(emission_material("normal", build_normal)); render("normal", "Raw", depth16=True)

with open(os.path.join(out, "view.json"), "w") as f:
    json.dump({"azimuth": az, "elevation": el, "lens_mm": cam_data.lens, "depth_near": zmin, "depth_far": zmax,
               "resolution": [scene.render.resolution_x, scene.render.resolution_y],
               "depth": "View Z, linear, near=1 (white) to far=0 between the 0.1st and 99.9th percentile of visible subject depth, clamped; background transparent",
               "normal": "camera space, RGB = n*0.5+0.5 with +X right, +Y up, +Z toward viewer; background transparent",
               "tone": "diffuse 0.6 grey, one area key upper side (raking, toward the side the subject faces), uniform white world fill 0.15, Standard view (sRGB), exposed so the 99th percentile lit value is 0.92", "tone_exposure": tone_exposure, "key_side": ks,
               "fix": cfg.get("fix", [0, 0, 0]), "vertices": n, "triangles": tris, "extent_xyz": ext.tolist()}, f, indent=1)
