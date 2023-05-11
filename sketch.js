new p5();
const width = () => windowWidth > 500 ? 0.6*windowWidth: windowWidth;
const height = () => 2/3*width();
let lvl = getItem('lvl') || 1, bscore = getItem('bscore') || 0, pscore = getItem('pscore') || 0;
let last_lvl = 5, bsl = 5, psl = 10; // ball score limit, paddle score level limit
let ball = [], paddle = [], speed = [];
const makeLine = () => height()-45;
let bg = color(255,255,0);
let pause = false;
const img = [], mp = [];

function preload() {
  img.push(loadImage("./assets/gold medal.png"));
  soundFormats('mp3', 'ogg');
  mp.push(loadSound("./assets/boing.mp3"));  //audio for the ball and paddle hitting
  mp.push(loadSound("./assets/fail.mp3"));  //audio for the ball scoring a point
}

function setup() {
  createCanvas(width(), height());
  initializeObjects(ball, paddle);
  if (lvl > 1) newLvl(lvl-1)
  mousePressed();
}

function draw() {
  // Background
  background(bg); stroke(0); strokeWeight(2);
  line(width()/2, 0, width()/2, 15); //top vertical line
  line(width()/2, 45, width()/2, height()); //bottom v line
  fill(red(bg)-40, green(bg)-40, blue(bg)-40);
  ellipse(width()/2, height()/2, 70, 70); //center circle
  // Scoreboard
  textSize(32); stroke(0); strokeWeight(2);
  textSize(32); text("Level "+lvl, width()/2-50, 40);
  text("Ball Score: "+bscore, 10, height()-10);
  text("Score: "+pscore, width()-150, height()-10);
  line(0, makeLine(), width(), makeLine()); // floor/score line
  if (lvl === 1) { // Instructions
    textSize(20); text("Controls:", 10, 70);
    textSize(16); fill(0); strokeWeight(0);
    text("Move the paddle with your mouse or finger.", 10, 90);
    text("Click / tap to pause and save the game.", 10, 107);
    text("Do not let the ball score reach 5!", 10, 127);
  }
  if (bscore >= bsl) { // You lose
    pause = true;
    clearStorage();
    stroke(0); strokeWeight(1)
    textSize(50); text("YOU LOSE!", width()/2-120, height()/2);
    textSize(20); text("try again?", width()/2-42, height()/2+55);
    noFill(); rect(width()/2-52, height()/2+35, 110, 30); bg = 255;
    ball.forEach((b,i) => b.pos(i*30+30,30));
  } else { // Move/Add objects
      move(ball[0], paddle[0]);
      if (lvl > 2) move(ball[1], paddle[0])
      if (lvl > 4) move(ball[2], paddle[0])
      if (pscore === psl*lvl) lvl < last_lvl ? win() : won()
      else if (pscore === psl*lvl+1) newLvl(lvl);
      if (lvl === last_lvl) bossLevel(ball[2]);
    }
  }

  mousePressed = () => {
    pause = !pause
    if (bscore >= bsl || lvl === last_lvl)
      if ((mouseX > width()/2-52)
      && (mouseY > height()/2+35)
      && (mouseX < width()/2-52+110)
      && (mouseY < height()/2)+35+30) {
        newLvl(last_lvl)
        bscore = 0
        pscore = 0
      }
    pause ? (
      speed = [], ball.forEach(b => { speed.push(b.s), b.sas(0) }),
      storeItem('lvl', lvl), storeItem('bscore', bscore), storeItem('pscore', pscore)
    ) : ball.forEach((b,i) => b.sas(speed[i]))
  }

  windowResized = () => {
    if (!pause) {
      mousePressed()
      pause = true
    }
    paddle[0].x = width()-50
    resizeCanvas(width(),height())
  }

  function initializeObjects(b,p) {
    b.push(new Ball (color(240, 0, 100), 3))
    b.push(new Ball (color(200, 255, 0), 4, 10, -1))
    b.push(new Ball (color(0, 255, 0), 4, 7, -1, -1))
    p.push(new Paddle (color(10, 200, 230)))
  }

  class Paddle {
    constructor(c, w=15, h=80, x=width()-50) {
      this._c = c // color
      this._w = w // width
      this._h = h // height
      this._x = x // x position
    }
    get w() { return this._w }
    get len() { return this._h }
    set len(h) { this._h = h }
    get y() { return mouseY - this._h/2 }
    get ylen() { return this.y + this.len }
    get x() { return this._x }
    set x(x) { this._x = x }
    display() {
      fill(this._c); strokeWeight(2); //noStroke();
      rect(this._x, this.y, this._w, this._h);
    };
  }

  class Ball {
    constructor(c,s=0,r=15,xd=1,yd=1,x=width()/2,y=height()/2) {
      this._c = c // color
      this._s = s // speed
      this._r = r // radius
      this._xd = xd // x direction
      this._yd = yd // y direction
      this._x = x // x position
      this._y = y // y position
    }
    get s() { return this._s }
    get r() { return this._r }
    sas(s=this._s, r=this._r) { this._s = s; this._r = r; return 1 }
    get xd() { return this._xd }
    set xd(z) { this._xd = z }
    get x() { return this._x }
    get y() { return this._y }
    pos(x,y) { this._x = x; this._y = y; return 1 }
    move() {
      if (this._r > this._y || this._y+this._r > makeLine()) this._yd *= -1
      if (this._r > this._x) this._xd *= -1
      this._x += this._xd * this._s;
      this._y -= this._yd * this._s;
      (() => { // render ball
        fill(this._c); strokeWeight(2); stroke(0);
        ellipse(this._x, this._y, this._r*2, this._r*2);
      })();
    }
  }

  function move(b,p) {
    p.display(); b.move()
    if (b.xd === 1 && b.x+b.r>p.x) {
      b.x+b.r > width() ? ( // ball hit wall
        mp[1].play(),
        bscore += 1, b.xd *= -1,
        stroke(250, 0, 0), strokeWeight(5),
        line(width(), 0, width(), height()),
        textSize(32), text("+1", width()/2-120, width()-50)
      ) : (p.y<b.y+b.r && b.y-b.r<p.ylen && b.x+b.r<p.x+p.w) ? (
        mp[0].play(),
        pscore += 1, b.xd *= -1,
        stroke(250, 0, 0), strokeWeight(2),
        line(p.x, p.y, p.x, p.ylen), fill(0),
        textSize(32), text("+1", width()/2+250, width()-50)
      ) : ''
    }
  }

  function win() {
    stroke(0); line(width()/2, 15, width()/2, 45);
    textSize(50); text("YOU WON!", width()/2-120, height()/2);
    lvl < last_lvl-1 ?
    (textSize(20), text(`Keep playing for Level ${lvl+1}!`, width()/2-110, height()/2+50))
    : (textSize(20), text("Keep playing for THE FINAL ROUND!", width()/2-162, height()/2+55))
  }

  function newLvl(l) {
    lvl = l === last_lvl ? 1 : l+1
    lvl > 3 ? paddle[0].len = 50 : paddle[0].len = 80
    lvl === 1 ? (bg = color(255, 255, 0), ball[0].sas(3,15))
    : lvl === 2 ? (bg = color(0, 235, 100), ball[0].sas(4,10))
    : lvl === 3 ? (bg = color(235, 100, 0), ball[0].sas(4,10), ball[1].sas(4,10))
    : lvl === 4 ? (bg = color(100, 0, 235), ball[0].sas(4,10), ball[1].sas(4,10))
    : ball.forEach(b => b.sas(4,7))
  }

  function won() {
    pause = true;
    clearStorage();
    textSize(50); text("YOU WIN!", width()/2-100, height()/2);
    textSize(20); text("play again?", width()/2-42, height()/2+55);
    noFill(); rect(width()/2-47, height()/2+35, 115, 30);
    ball[0].pos(30,30); ball[1].pos(60,30); ball[2].pos(90,30);
    bg = 255;
    image(img[0], width()/2-75, 0, 150, 150);  //Calling image for winning
  }

  function bossLevel(b) {  //Final/Boss level background
    let p = width()/12
    bg = (p < b.x && b.x < p*2) || (p*3 < b.x && b.x < p*4)
    || (p*5 < b.x && b.x < p*6) || (p*7 < b.x && b.x < p*8)
    || (p*9 < b.x && b.x < p*10) || (p*11 < b.x && b.x < width())
    ? 0 : 255
  }