import {
    BufferGeometry,
    BufferAttribute,
    ShaderMaterial,
    ShaderChunk,
    Vector2,
    Vector3,
    Color,
    ColorRepresentation,
  } from 'three';

export class TracksMesh extends BufferGeometry {
    next_track_id: number;
    positions: number[];
    previous: number[];
    next: number[];
    colors: number[];
    counter: number[];
    track_id: any[];
    side: any[];
    indices_array: any[];
    _attributes: any;

    constructor() {
        super()
        this.type = 'TracksMesh'
        this.positions = []
        this.previous = []
        this.next = []
        this.side = []
        this.counter = []
        this.track_id = []
        this.colors = []
        this.indices_array = []
        this.next_track_id = 0
    }

    addTrack(points:Vector3[], color:ColorRepresentation) {
        const id = this.next_track_id++

        const col = new Color(color)

        this.previous.push(points[0].x, points[0].y, points[0].z)
        this.previous.push(points[0].x, points[0].y, points[0].z)
        
        for (let i=0; i<points.length; i++) {
            const p = points[i]
            const n = this.positions.length / 3

            this.positions.push(p.x, p.y, p.z)
            this.positions.push(p.x, p.y, p.z)
            this.side.push(1, -1)
            this.track_id.push(id, id)
            this.colors.push(col.r, col.g, col.b)
            this.colors.push(col.r, col.g, col.b)
            this.counter.push(i/points.length, i/points.length)

            if (i < points.length - 1) {
                this.previous.push(p.x, p.y, p.z)
                this.previous.push(p.x, p.y, p.z)
                this.indices_array.push(n, n+1, n+2)
                this.indices_array.push(n+2, n+1, n+3)
            } else if (i > 0) {
                this.next.push(p.x, p.y, p.z)
                this.next.push(p.x, p.y, p.z)
            }
        }

        const i = points.length - 1
        this.next.push(points[i].x, points[i].y, points[i].z)
        this.next.push(points[i].x, points[i].y, points[i].z)

        //this.process()
        return id
    }

    process() {
        if (!this._attributes || this._attributes.position.count !== this.positions.length) {
            this._attributes = {
                position: new BufferAttribute(new Float32Array(this.positions), 3),
                previous: new BufferAttribute(new Float32Array(this.previous), 3),
                next: new BufferAttribute(new Float32Array(this.next), 3),
                side: new BufferAttribute(new Float32Array(this.side), 3),
                track_id: new BufferAttribute(new Uint16Array(this.track_id), 1),
                color: new BufferAttribute(new Float32Array(this.colors), 3),
                counter: new BufferAttribute(new Float32Array(this.counter), 1),
                index: new BufferAttribute(new Uint16Array(this.indices_array), 1),
            }
        } else {
            (this._attributes.position as BufferAttribute).copyArray(new Float32Array(this.positions));
            this._attributes.position.needsUpdate = true;
            (this._attributes.previous as BufferAttribute).copyArray(new Float32Array(this.previous));
            this._attributes.previous.needsUpdate = true;
            (this._attributes.next as BufferAttribute).copyArray(new Float32Array(this.next));
            this._attributes.next.needsUpdate = true;
            (this._attributes.side as BufferAttribute).copyArray(new Float32Array(this.side));
            this._attributes.side.needsUpdate = true;
            (this._attributes.track_id as BufferAttribute).copyArray(new Uint16Array(this.track_id));
            this._attributes.track_id.needsUpdate = true;
            (this._attributes.color as BufferAttribute).copyArray(new Float32Array(this.colors));
            this._attributes.color.needsUpdate = true;
            (this._attributes.counter as BufferAttribute).copyArray(new Float32Array(this.counter));
            this._attributes.counter.needsUpdate = true;
            (this._attributes.index as BufferAttribute).copyArray(new Uint16Array(this.indices_array));
            this._attributes.index.needsUpdate = true;
        }

        this.setAttribute('position', this._attributes.position)
        this.setAttribute('previous', this._attributes.previous)
        this.setAttribute('next', this._attributes.next)
        this.setAttribute('side', this._attributes.side)
        this.setAttribute('track_id', this._attributes.track_id)
        this.setAttribute('color', this._attributes.color)
        this.setAttribute('counter', this._attributes.counter)

        this.setIndex(this._attributes.index as BufferAttribute)

        this.computeBoundingSphere()
        this.computeBoundingBox()
    }
}

ShaderChunk['tracks_vert'] = [
    'attribute vec3 previous;',
    'attribute vec3 next;',
    'attribute int track_id;',
    'attribute float side;',
    'attribute vec3 color;',
    'attribute float counter;',

    'varying vec3 v_color;',
    'varying float v_counter;',

    'uniform vec2 resolution;',
    'uniform float lineWidth;',
    'void main() {',
    '  vec2 aspect = vec2(resolution.x / resolution.y, 1.0);',
    '',
    '  v_color = color;',
    '  v_counter = counter;',
    '',
    '  mat4 m = projectionMatrix * modelViewMatrix;',
    '  vec4 finalPosition = m * vec4(position, 1.0);',
    '  vec4 prevPos = m * vec4(previous, 1.0);',
    '  vec4 nextPos = m * vec4(next, 1.0);',
    '',
    '  vec2 curP = finalPosition.xy / finalPosition.w * aspect;',
    '  vec2 prevP = prevPos.xy / prevPos.w * aspect;',
    '  vec2 nextP = nextPos.xy / nextPos.w * aspect;',
    '',
    '  vec2 dir;',
    '  if (curP == prevP) dir = normalize(nextP - curP);',
    '  else if (curP == nextP) dir = normalize(curP - prevP);',
    '  else dir = normalize(curP - prevP);',
    '',
    '  vec2 normal = vec2(-dir.y, dir.x);',
    '  normal.xy *= .5 * lineWidth;',
    '  normal.x /= aspect.x;',
    '  normal.xy *= finalPosition.w * 0.001;',

    '  finalPosition.xy += normal.xy * side;',
    '  gl_Position = finalPosition;',
    '}'
].join('\n')

ShaderChunk['tracks_frag'] = [
    'uniform float progress;',
    'varying vec3 v_color;',
    'varying float v_counter;',
    'void main() {',
    '  if (v_counter > progress) discard;',
    '  gl_FragColor = vec4(v_color, 1.0);',
    '}'
].join('\n')

export class TracksMaterial extends ShaderMaterial {
    isTracksMaterial: boolean;
    constructor(params) {
        super({
            uniforms: Object.assign({}, {
                lineWidth: {value: 1},
                resolution: { value: new Vector2(1,1) },
                progress: {value: 1}
            }),
            vertexShader: ShaderChunk.tracks_vert,
            fragmentShader: ShaderChunk.tracks_frag
        })
        this.isTracksMaterial = true
        this.type = "TracksMaterial"

        Object.defineProperties(this, {
            lineWidth: {
              enumerable: true,
              get: function() {
                return this.uniforms.lineWidth.value
              },
              set: function(value) {
                this.uniforms.lineWidth.value = value
              },
            },
            resolution: {
              enumerable: true,
              get: function() {
                return this.uniforms.resolution.value
              },
              set: function(value) {
                this.uniforms.resolution.value.copy(value)
              },
            },
            progress: {
                enumerable: true,
                get: function() {
                  return this.uniforms.progress.value
                },
                set: function(value) {
                  this.uniforms.progress.value = value
                },
            }
        })

        this.setValues(params)
    }
}