#!/usr/bin/env python3
"""
BSWV21 art pack pipeline (PRD Appendix C): takes the raw green-screen AI-generated
sheets, chroma-keys the background out, auto-slices each into its animation frames,
rescales every frame of a character to one uniform scale (so it doesn't resize
between animations), and composites each frame onto a fixed-size transparent canvas
with a consistent pivot - foot-anchored for robots, centered for Badsoffwares.

Usage: python3 tools/process_bswv21.py <raw_dir> <out_dir>
Raw dir layout is whatever the BSWV21_*.zip files extract to (see ROBOTS/DRONES below
for the exact source filenames this expects per character).
"""
import sys, os, json
from PIL import Image

GREEN_BG = lambda r, g, b: g > r + 30 and g > b + 30 and g > 100

def chroma_key(im):
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if GREEN_BG(r, g, b):
                px[x, y] = (r, g, b, 0)
    return im

def col_has_content(im, x):
    px = im.load()
    h = im.size[1]
    for y in range(h):
        if px[x, y][3] > 10:
            return True
    return False

def content_bbox(im):
    return im.getbbox()

def split_into_frames(im, n):
    """Find n frames by grouping non-transparent columns into contiguous runs,
    falling back to equal-width slicing if auto-detection doesn't find exactly n."""
    w, h = im.size
    has = [col_has_content(im, x) for x in range(w)]
    runs = []
    x = 0
    while x < w:
        if has[x]:
            x0 = x
            while x < w and has[x]:
                x += 1
            runs.append((x0, x))
        else:
            x += 1
    if len(runs) != n:
        fw = w / n
        runs = [(int(i * fw), int((i + 1) * fw)) for i in range(n)]
    frames = []
    for (x0, x1) in runs:
        crop = im.crop((x0, 0, x1, h))
        bbox = content_bbox(crop)
        frames.append(crop.crop(bbox) if bbox else crop)
    return frames

MARGIN = 3   # px of breathing room so a wide pose (e.g. a dizzy "tagged" frame with arms splayed) never clips the canvas edge

def paste_pivot(frame, canvas_size, scale, foot_anchor):
    cw, ch = canvas_size
    fw, fh = frame.size
    # per-frame safety clamp: the character-wide scale keeps size consistent across animations, but
    # an unusually wide/tall individual pose (arms thrown out, a crouch) can still overflow the
    # canvas at that scale - clamp just that frame rather than let it clip or shrink every frame
    eff_scale = min(scale, (cw - MARGIN) / fw, (ch - MARGIN) / fh)
    nw, nh = max(1, round(fw * eff_scale)), max(1, round(fh * eff_scale))
    scaled = frame.resize((nw, nh), Image.NEAREST)
    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    px = (cw - nw) // 2
    py = (ch - 2 - nh) if foot_anchor else (ch - nh) // 2
    py = max(0, py)
    canvas.alpha_composite(scaled, (px, py))
    return canvas

def process_animation(src_path, n_frames, canvas_size, scale, foot_anchor):
    raw = Image.open(src_path)
    cw, ch = canvas_size
    # already pre-sliced to exact frame size (e.g. a 256x64 strip = 4 frames of 64x64, delivered
    # ready to use) - pass through with just the chroma key, no further rescale/recenter, since
    # rescaling an already-correct frame by the character's run-cycle scale would shrink it twice
    if raw.size == (cw * n_frames, ch):
        im = chroma_key(raw)
        strip = Image.new('RGBA', im.size, (0, 0, 0, 0))
        strip.alpha_composite(im, (0, 0))
        return strip, n_frames
    im = chroma_key(raw)
    frames = split_into_frames(im, n_frames)
    out = [paste_pivot(f, canvas_size, scale, foot_anchor) for f in frames]
    strip = Image.new('RGBA', (canvas_size[0] * len(out), canvas_size[1]), (0, 0, 0, 0))
    for i, f in enumerate(out):
        strip.alpha_composite(f, (i * canvas_size[0], 0))
    return strip, len(out)

def median(values):
    s = sorted(values); n = len(s)
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2

def character_scale(raw_dir, run_file, n_run, target_h):
    # median, not max: one arm-raised run frame can be much taller than the rest and would drag
    # the whole character smaller than its actual standing size if max were used
    im = chroma_key(Image.open(os.path.join(raw_dir, run_file)))
    frames = split_into_frames(im, n_run)
    return target_h / median(f.size[1] for f in frames)

ROBOT_CANVAS = (84, 84)
ROBOT_TARGET_H = 50
DRONE_CANVAS = (48, 48)
DRONE_TARGET_H = 34

ROBOTS = {
    'patch': {
        'run': ('BSWV21_Patch/patch_run_8_frames.png', 8),
        'jump': ('BSWV21_Patch/patch_jump_2_frames.png', 2),
        'fall': ('BSWV21_Patch/patch_fall_2_frames.png', 2),
        'land': ('BSWV21_Patch/patch_land_3_frames.png', 3),
        'tagged': ('BSWV21_Patch/patch_tagged_4_frames.png', 4),
    },
    'bolt': {
        'run': ('BSWV21_Bolt/03_run_8_frames.png', 8),
        'jump': ('BSWV21_Bolt/04_jump_2_frames.png', 2),
        'fall': ('BSWV21_Bolt/05_fall_2_frames.png', 2),
        'land': ('BSWV21_Bolt/06_land_3_frames_variant_a.png', 3),
        'tagged': ('BSWV21_Bolt/08_tagged_4_frames_variant_a.png', 4),
    },
    'glitch': {
        'idle': ('idle/Glitch_Idle_Generation_01.png', 4),
        'run': ('run/Glitch_Run.png', 8),
        'jump': ('jump/Glitch_Jump_Generation_01.png', 2),
        'fall': ('fall/Glitch_Fall.png', 2),
        'land': ('land/Glitch_Land_Generation_01.png', 3),
        'tagged': ('tagged/Glitch_Tagged.png', 4),
    },
    'havoc': {
        'idle': ('BSWV21_Havoc/Havoc_Idle_4F_256x64.png', 4),
        'run': ('BSWV21_Havoc/Havoc_Run_Generated_Source.png', 8),
        'jump': ('BSWV21_Havoc/Havoc_Jump_Generated_Source.png', 2),
        'fall': ('BSWV21_Havoc/Havoc_Fall_Generated_Source.png', 2),
        'land': ('BSWV21_Havoc/Havoc_Land_Generated_Source.png', 3),
        # no tagged art delivered for Havoc - stopgap built in-game from the idle frame (DECISIONS.md precedent)
    },
}
# Rumble: the 4th pilot. Until these sheets exist the game borrows Havoc's sprites tinted orange.
# Prompts and the exact file spec: docs/RUMBLE_ART_PROMPTS.md. Add just him with:
#   python3 tools/process_bswv21.py <raw_dir> art rumble
ROBOTS['rumble'] = {
    'idle': ('BSWV21_Rumble/rumble_idle_4_frames.png', 4),
    'run': ('BSWV21_Rumble/rumble_run_8_frames.png', 8),
    'jump': ('BSWV21_Rumble/rumble_jump_2_frames.png', 2),
    'fall': ('BSWV21_Rumble/rumble_fall_2_frames.png', 2),
    'land': ('BSWV21_Rumble/rumble_land_3_frames.png', 3),
    'tagged': ('BSWV21_Rumble/rumble_tagged_4_frames.png', 4),
}
# Rumble's sheets were each drawn at a different zoom (measured by the yellow shoulder ring: jump is
# 1.30x idle, fall 1.24x, land 1.23x, tagged 1.10x), and their poses differ a lot in height (arms up,
# crouch), so the per-animation height normalisation below would make him change size between actions.
# For robots listed here every animation is scaled from the IDLE scale divided by that zoom instead.
ROBOT_SIZE = {'rumble': 0.92}      # he is a wide bruiser; shave him down so the body, not just the height, stays in family
ROBOT_ZOOM = {'rumble': {'idle': 1.0, 'run': 1.0, 'jump': 1.30, 'fall': 1.24, 'land': 1.23, 'tagged': 1.10}}
DRONES = {
    'bopster': {'hover': ('Bopster_Hover_Animation.png', 4), 'spawn': ('Bopster_Spawn_Animation.png', 4)},
    'grumpulator': {'hover': ('BSWV21_Grumpulator_Hover.png', 4)},   # spawn stays procedural (DECISIONS.md)
    'sneakfolder': {'hover': ('Sneakfolder_Hover_4frames_192x48.png', 4)},  # spawn stays procedural
    'hijacker': {'hover': ('BSWV21_Hijacker/Hijacker_Hover_Animation.png', 4), 'spawn': ('BSWV21_Hijacker/Hijacker_Spawn_Animation.png', 4)},
}

def main():
    raw_dir, out_dir = sys.argv[1], sys.argv[2]
    only = sys.argv[3:]          # optional robot names: process just those and merge into the existing manifest
    os.makedirs(os.path.join(out_dir, 'robots'), exist_ok=True)
    os.makedirs(os.path.join(out_dir, 'badsoffwares'), exist_ok=True)
    manifest_path = os.path.join(out_dir, 'manifest.json')
    manifest = json.load(open(manifest_path)) if only and os.path.exists(manifest_path) else {'robots': {}, 'badsoffwares': {}}

    for name, anims in ROBOTS.items():
        if only and name not in only: continue
        if not only and not os.path.exists(os.path.join(raw_dir, anims['run'][0])):
            print('skip robot', name, '(no raw art delivered yet)'); continue
        run_file, n_run = anims['run']
        # scale PER ANIMATION, each normalized independently to ROBOT_TARGET_H from its own
        # median frame height - not one scale derived from the run cycle and reused everywhere.
        # The source files for different animations (run vs jump/fall/land/tagged) turned out to
        # be drawn at different native zoom levels (separate generation batches), so a single
        # character-wide scale left jump/fall/land/tagged 1.4-1.5x taller than idle/run after the
        # per-frame overflow clamp quietly kicked in - the character visibly changed size between
        # actions. Normalizing every animation to the same target height on its own fixes that;
        # pose-to-pose height variation within one animation (a crouch, a reach) is real animation
        # and stays, since it's compared against that animation's own median, not inflated by it.
        anim_scales = {anim: character_scale(raw_dir, file, n, ROBOT_TARGET_H) for anim, (file, n) in anims.items()}
        if name in ROBOT_ZOOM:
            base = anim_scales['idle']
            anim_scales = {a: base * ROBOT_SIZE.get(name, 1.0) / ROBOT_ZOOM[name].get(a, 1.0) for a in anims}
        manifest['robots'][name] = {'frame': ROBOT_CANVAS[0], 'scale': round(anim_scales[list(anims)[0]], 4), 'anims': {}}
        for anim, (file, n) in anims.items():
            strip, nf = process_animation(os.path.join(raw_dir, file), n, ROBOT_CANVAS, anim_scales[anim], True)
            out_path = os.path.join(out_dir, 'robots', f'{name}_{anim}.png')
            strip.save(out_path)
            manifest['robots'][name]['anims'][anim] = {'frames': nf, 'file': f'robots/{name}_{anim}.png'}
            print('robot', name, anim, nf, 'frames, scale', round(anim_scales[anim], 4), '->', out_path)
        # stopgaps (DECISIONS.md precedent): no clean delivered strip for this animation, so build
        # one frame from an animation that does exist and animate it in code instead (idle bob /
        # tagged shake), rather than block on art that isn't there
        if 'idle' not in anims:
            strip, _ = process_animation(os.path.join(raw_dir, run_file), n_run, ROBOT_CANVAS, anim_scales['run'], True)
            frame0 = strip.crop((0, 0, ROBOT_CANVAS[0], ROBOT_CANVAS[1]))
            out_path = os.path.join(out_dir, 'robots', f'{name}_idle.png')
            frame0.save(out_path)
            manifest['robots'][name]['anims']['idle'] = {'frames': 1, 'file': f'robots/{name}_idle.png', 'stopgap': 'bob'}
            print('robot', name, 'idle', 1, 'frame (stopgap: code-driven bob) ->', out_path)
        if 'tagged' not in anims:
            idle_file = anims.get('idle', (run_file, n_run))[0]
            idle_n = anims.get('idle', (run_file, n_run))[1]
            idle_scale = anim_scales.get('idle', anim_scales['run'])
            strip, _ = process_animation(os.path.join(raw_dir, idle_file), idle_n, ROBOT_CANVAS, idle_scale, True)
            frame0 = strip.crop((0, 0, ROBOT_CANVAS[0], ROBOT_CANVAS[1]))
            out_path = os.path.join(out_dir, 'robots', f'{name}_tagged.png')
            frame0.save(out_path)
            manifest['robots'][name]['anims']['tagged'] = {'frames': 1, 'file': f'robots/{name}_tagged.png', 'stopgap': 'shake'}
            print('robot', name, 'tagged', 1, 'frame (stopgap: code-driven shake) ->', out_path)

    for name, anims in ({} if only else DRONES).items():
        manifest['badsoffwares'][name] = {'frame': DRONE_CANVAS[0], 'anims': {}}
        # drones: scale each anim independently off its own tallest frame (no shared run cycle to anchor to)
        for anim, (file, n) in anims.items():
            im = chroma_key(Image.open(os.path.join(raw_dir, file)))
            frames = split_into_frames(im, n)
            scale = DRONE_TARGET_H / median(f.size[1] for f in frames)
            strip, nf = process_animation(os.path.join(raw_dir, file), n, DRONE_CANVAS, scale, False)
            out_path = os.path.join(out_dir, 'badsoffwares', f'{name}_{anim}.png')
            strip.save(out_path)
            manifest['badsoffwares'][name]['anims'][anim] = {'frames': nf, 'file': f'badsoffwares/{name}_{anim}.png'}
            print('drone', name, anim, nf, 'frames ->', out_path)

    with open(os.path.join(out_dir, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
    print('manifest written to', os.path.join(out_dir, 'manifest.json'))

if __name__ == '__main__':
    main()
