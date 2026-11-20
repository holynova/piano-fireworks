"""Render the waterfront and the score at fixed frame times. Requires numpy, OpenCV, ffmpeg and macOS."""
from pathlib import Path
import json
import subprocess
import tempfile
import cv2 as cv
import numpy as np

from score import arrangement, seconds, FPS, DURATION, CLIMAX

W, H, SHORE = 720, 1280, 909
ROOT = Path(__file__).resolve().parents[1]
rng = np.random.default_rng(3419)
AA = cv.LINE_AA
# Values are RGB throughout, including the raw frame pipe.
PALETTE = [(255,188,103), (255,220,172), (213,229,255)]
Y, X = np.mgrid[:H, :W].astype(np.float32)
WY, WX = np.mgrid[:H-SHORE, :W].astype(np.float32)
cv.setNumThreads(2)

def gradient(rows, stops, colors):
    return np.stack([np.interp(rows, stops, c) for c in zip(*colors)], axis=-1)

def waterfront():
    sky = gradient(Y[:SHORE], [0, 275, 630, SHORE], [(4,8,23),(8,15,34),(22,38,65),(60,78,103)])
    cloud = np.zeros((SHORE,W),np.float32)
    for rows, cols, gain in [(6,5,2.1),(19,12,.85),(44,28,.4)]:
        cloud += gain * cv.resize(rng.normal(size=(rows,cols)).astype('f'),(W,SHORE),interpolation=cv.INTER_CUBIC)
    sky += cloud[:,:,None]*[.8,.85,1.14]
    sky -= (2.8*((X[:SHORE]-W/2)/(W/2))**2)[:,:,None]
    sky = np.uint8(np.clip(sky,0,255))
    for _ in range(260):
        x, y = rng.integers([0,0], [W,830])
        strength = rng.uniform(8,110)*(1-y/1250)
        c=tuple(np.minimum(255, sky[y,x]+strength*np.array([.84,.92,1])))
        cv.circle(sky,(x,y),int(strength>64),c,-1,AA)
    for layer,base in enumerate([859,882,900]):
        x=-6
        while x<W:
            w=int(rng.integers(12+5*layer,43+7*layer))
            ht=int(rng.integers(17,65+layer*10))
            top=base-ht
            col=[(29,43,61),(16,26,42),(9,16,29)][layer]
            cv.rectangle(sky,(x,top),(x+w,SHORE),col,-1)
            if rng.random()<.4:
                cv.rectangle(sky,(x+w//4,top-4),(x+3*w//4,top),col,-1)
            for yy in range(top+5,base-3,6):
                for xx in range(x+3,x+w-2,5):
                    if rng.random()<.135:
                        light=np.array([165,137,97]) if rng.random()<.65 else np.array([120,153,182])
                        c=tuple(np.maximum(col,light*rng.uniform(.28,.92)))
                        cv.line(sky,(xx,yy),(xx+1,yy),c,1,AA)
            x+=w+int(rng.integers(1,8))
    cv.rectangle(sky,(0,897),(W,SHORE),(11,17,24),-1)
    for x in range(3,W,18):
        cv.line(sky,(x,897),(x,901),(77,66,51),1,AA)
        cv.circle(sky,(x,897),1,(184,150,103),-1,AA)
    water = gradient(WY,[0,90,H-SHORE],[(22,32,49),(15,23,41),(6,12,25)]).astype('uint8')
    return sky, water

class Firework:
    def __init__(self, shell, i):
        self.s = shell
        self.start, self.hit = seconds(shell.launch), seconds(shell.hit)
        self.x, self.y = W*shell.x, H*shell.y
        self.lx = W*(.5+.13*(shell.x-.5)) if shell.group=='ring' else W*(.33+.34*shell.x)
        self.color = np.array(PALETTE[shell.color])
        n = 180 if shell.group=='ring' else 240
        # Equal-area sphere, with small variations in direction, speed and burn time.
        z = (np.arange(n)+.5)*2/n-1
        theta=np.arange(n)*2.399963 + rng.uniform(0,6.28) + rng.normal(0,.04,n)
        r=np.sqrt(1-z*z)
        self.vel = np.column_stack((r*np.cos(theta),z)) * (W*shell.radius*rng.uniform(.84,1.16,n))[:,None]
        self.brightness = rng.uniform(.65,1,n)*(.86+.14*r*np.sin(theta))
        self.phase=rng.uniform(0,6.28,n)
        self.life=rng.uniform(.85,1.65,n) * (1.25 if shell.group=='ring' else 1)
        self.drift=np.array([(i%5-2)*.95, 4.5])

    def ascent(self, t):
        u=np.clip((t-self.start)/(self.hit-self.start),0,1)
        # Most of the distance is covered while the comet is first climbing.
        return np.array([self.lx+(self.x-self.lx)*u, SHORE-10+(self.y-SHORE+10)*(1-(1-u)**1.45)])

    def draw(self, light, haze, t):
        age=t-self.hit
        if t < self.start or age>2.2: return
        if age<0:
            trail=.125 if self.s.group!='ring' else .24
            pts=[self.ascent(t-trail*(1-j/6)).astype(int) for j in range(7)]
            for j in range(6):
                col=tuple(((j+1)/7 * np.array([190,151,106])).tolist())
                cv.line(light,pts[j],pts[j+1],col,1,AA)
            cv.circle(light,pts[-1],1,(255,238,204),-1,AA)
            return
        center=(round(self.x),round(self.y))
        flash=np.exp(-age*13)
        if flash>.01:
            cv.circle(light,center,max(1,int(3+4*flash)),tuple((self.color*flash).tolist()),-1,AA)
        def particles(a):
            return (np.array(center) + (1-np.exp(-2.8*a))*self.vel
                    + self.drift*np.array([a*a,a*a]) + [0,2.2*a*a])
        head=particles(age)
        tail=particles(max(0,age-.10))
        lines=np.stack((tail,head),axis=1)
        # Subpixel polylines avoid shimmer and hold dots together at mobile resolutions.
        lines=np.int32(np.round(lines*16))
        intensity=np.clip((self.life-age)*2.3,0,1)*self.brightness*(.83+.17*np.sin(self.phase+age*15))
        for level in range(1,7):
            selected=lines[(intensity>(level-1)/6+.004)&(intensity<=level/6+.004)]
            if len(selected):
                warm=np.array([1,max(.63,1-age*.18),max(.47,1-age*.34)])
                col=tuple(np.minimum(255, self.color * warm * ((level+.6)/5.5)).tolist())
                cv.polylines(light,selected,False,col,1,AA,4)
        # Low-frequency afterglow and drifting smoke.
        opacity=(.12*np.exp(-age*2.4)+.04*np.sin(min(1,age)*np.pi/2)) * max(0,1-age/2.2)
        small=(int((self.x+age*5)/8),int((self.y-age*6)/8))
        cv.circle(haze,small,max(1,int((6+age*13)/2)),tuple((self.color*opacity).tolist()),-1,AA)

class Scene:
    def __init__(self):
        self.sky,self.water=waterfront()
        self.notes, shells=arrangement()
        self.shells=[Firework(s,i) for i,s in enumerate(shells)]
        self.water_gain=(.43-.14*WY/(H-SHORE))[:,:,None]
        self.reflect_y=(SHORE-1-WY*1.18).astype('f')

    def frame(self,t):
        lights=np.zeros_like(self.sky)
        haze=np.zeros((SHORE//8,W//8,3), np.uint8)
        for shell in self.shells:
            shell.draw(lights,haze,t)
        bloom=cv.resize(lights,(W//4,SHORE//4),interpolation=cv.INTER_AREA)
        glow=cv.addWeighted(cv.GaussianBlur(bloom,(0,0),1.55),1.7,cv.GaussianBlur(bloom,(0,0),5.2),1.5,0)
        field=cv.resize(cv.GaussianBlur(haze,(0,0),2.6),(W,SHORE))
        sky=cv.add(self.sky,field)
        sky=cv.add(sky,cv.resize(glow,(W,SHORE)))
        sky=cv.add(sky,lights)
        # Perspective steepens the reflected rays and widens the ripples towards the viewer.
        p=WY/(H-SHORE)
        ripple=np.sin(WY*.86+t*2+.007*WX)*.45+np.sin(WY*.30-t*1.9+.011*WX)*.55+np.sin(WY*.14+t*1.5)*.65
        map_x=(WX+ripple*(.8+7*p)).astype('f')
        map_y=self.reflect_y+(.9+2.6*p)*np.sin(WY*.63+t*1.4+WX*.008)
        reflection=cv.remap(sky,map_x,map_y,cv.INTER_LINEAR,borderMode=cv.BORDER_REPLICATE)
        surface=np.uint8(np.clip(self.water+reflection*self.water_gain*(.93+.15*ripple[:,:,None]),0,255))
        return np.vstack((sky,surface))

def render():
    scene=Scene()
    with tempfile.TemporaryDirectory() as directory:
        tmp=Path(directory)
        part=tmp/'notes.json'
        part.write_text(json.dumps(scene.notes))
        piano=tmp/'grand.caf'
        subprocess.run(['swift',str(ROOT/'src/piano.swift'),str(part),str(piano),str(DURATION)],check=True)
        target=tmp/'performance.mp4'
        cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}',
             '-framerate',str(FPS),'-i','pipe:0','-i',str(piano),'-af','volume=7.5dB,afade=t=out:st=16.25:d=0.75',
             '-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-colorspace','bt709',
             '-vf','scale=out_color_matrix=bt709','-color_primaries','bt709','-color_trc','bt709',
             '-c:a','aac','-b:a','256k','-movflags','+faststart',str(target)]
        with subprocess.Popen(cmd,stdin=subprocess.PIPE) as enc:
            for i in range(DURATION*FPS):
                enc.stdin.write(scene.frame(i/FPS).tobytes())
            enc.stdin.close()
            if enc.wait(): raise RuntimeError('ffmpeg failed')
        import shutil
        shutil.copyfile(target,ROOT/'piano-fireworks.mp4')
        poster=scene.frame(seconds(CLIMAX)+.40)
        cv.imwrite(str(ROOT/'poster.jpg'),cv.cvtColor(poster,cv.COLOR_RGB2BGR),[cv.IMWRITE_JPEG_QUALITY,94])
if __name__=='__main__':
    render()
