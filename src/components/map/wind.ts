// Animated wind streamlines: particles advected through the gridded wind field, drawn with fading trails
// on a canvas overlay. The map never rotates or pitches, so screen <-> lon/lat is a plain Mercator mapping.
import type { Map as MLMap } from 'maplibre-gl';
import { at, type Grid } from './field';

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const latOf = (y: number) => (360 / Math.PI) * Math.atan(Math.exp(y)) - 90;

export class WindParticles {
  private ctx: CanvasRenderingContext2D;
  private pts: { x: number; y: number; age: number; max: number }[] = [];
  private grid: Grid | null = null;
  private raf = 0;
  private moving = false;
  private dpr = 1;
  private color = 'rgba(255,255,255,.85)';

  constructor(private canvas: HTMLCanvasElement, private map: MLMap) {
    this.ctx = canvas.getContext('2d')!;
    map.on('movestart', this.onMoveStart);
    map.on('moveend', this.onMoveEnd);
    map.on('resize', this.resize);
    this.resize();
  }

  setGrid(g: Grid | null) { this.grid = g; this.seed(); }
  setColor(c: string) { this.color = c; }

  start() { if (!this.raf) this.raf = requestAnimationFrame(this.frame); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; this.clear(); }
  destroy() {
    this.stop();
    this.map.off('movestart', this.onMoveStart); this.map.off('moveend', this.onMoveEnd); this.map.off('resize', this.resize);
  }

  private onMoveStart = () => { this.moving = true; this.clear(); };
  private onMoveEnd = () => { this.moving = false; this.seed(); };
  private resize = () => {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = this.map.getContainer().getBoundingClientRect();
    this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
    this.seed();
  };
  private clear() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }

  private seed() {
    const W = this.canvas.width, H = this.canvas.height;
    const n = Math.min(4200, Math.round((W * H) / (this.dpr * this.dpr * 260)));
    this.pts = Array.from({ length: n }, () => this.spawn({ x: 0, y: 0, age: 0, max: 0 }, true));
    this.clear();
  }
  private spawn(p: { x: number; y: number; age: number; max: number }, randomAge = false) {
    p.x = Math.random() * this.canvas.width; p.y = Math.random() * this.canvas.height;
    p.max = 50 + Math.random() * 70; p.age = randomAge ? Math.random() * p.max : 0;
    return p;
  }

  private frame = () => {
    this.raf = requestAnimationFrame(this.frame);
    const g = this.grid;
    if (this.moving || !g) return;
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    const b = this.map.getBounds();
    const w = b.getWest(), e = b.getEast(), yN = mercY(b.getNorth()), yS = mercY(b.getSouth());
    // fade previous trails
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0,0,0,.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.4 * this.dpr;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const k = 0.075 * this.dpr; // px per frame per km/h
    for (const p of this.pts) {
      const lon = w + ((e - w) * p.x) / W, lat = latOf(yN + ((yS - yN) * p.y) / H);
      const u = at(g, g.u, lon, lat), v = at(g, g.v, lon, lat);
      if (!isFinite(u) || !isFinite(v) || ++p.age > p.max) { this.spawn(p); continue; }
      const nx = p.x + u * k, ny = p.y - v * k;
      ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (nx < 0 || ny < 0 || nx > W || ny > H) this.spawn(p);
    }
    ctx.stroke();
  };
}
