const GRID_OFFSET = 0;
const DIRECTION_VECTOR_SCALE = 75;
let canvas = document.getElementById("main-canvas");

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;
canvas.width = 800;
canvas.height = 800;
let playerX = 275;
let playerY = 420;
let mouseX = 0;
let mouseY = 0;
let context = canvas.getContext("2d");

let map = [
           [0, 0, 0, 1, 0, 0],
           [0, 0, 0, 1, 0, 0],
           [0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 0, 0],
           [0, 0, 0, 0, 1, 1]
          ];

const CELL_WIDTH = Math.floor(canvas.width / map[0].length);
const CELL_HEIGHT = Math.floor(canvas.height / map.length);

class Vec2{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    add(otherVec2){
        return new Vec2(this.x + otherVec2.x, this.y + otherVec2.y);
    }

    sub(otherVec2){
        return new Vec2(this.x - otherVec2.x, this.y - otherVec2.y);
    }

    divide(scalar){
        return new Vec2(this.x / scalar, this.y / scalar);
    }

    scale(scalar){
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    magnitude(){
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    normalise(){
        if(this.magnitude() === 0) { return new Vec2(1, 0); }
        return new Vec2(this.x / this.magnitude(), this.y / this.magnitude());
    }

    dot(otherVec2) {
        return (this.x * otherVec2.x) +  (this.y * otherVec2.y);
    }

    asArray(){
        return [this.x, this.y];
    }
    
    toString(){
        return `${this.x},${this.y}`;
    }
};

function drawGrid()
{
    context.beginPath();
    context.lineWidth = 1;

    let cols = map[0].length;
    let rows = map.length;
    let h = 0;
    let w = 0;

    for (let row = 0; row < rows; row++) {
        for(let col=0; col<cols; col++){
            if(map[row][col] === 1)
            {
                topLeftX = col*CELL_WIDTH;
                topLeftY = row*CELL_HEIGHT;
                context.fillStyle = "red";
                context.fillRect(topLeftX, topLeftY, CELL_WIDTH, CELL_HEIGHT);
            }
        }
    }

    for(let i=0; i<=rows; i++)
    {
        context.moveTo(0, h)
        context.lineTo((CELL_WIDTH*cols), h)
        context.stroke();
        h += CELL_HEIGHT;
    }

    for(let i=0; i<=cols; i++)
    {
        context.moveTo(w, 0);
        context.lineTo(w, (CELL_HEIGHT*rows));
        context.stroke();
        w += CELL_WIDTH
    }

    context.closePath();
}

function drawPlayerLocation()
{
    context.beginPath()
    context.arc(playerX, playerY, 10, 0, 2 * Math.PI);
    context.fillStyle = "blue"
    context.fill();
    context.stroke();

    context.moveTo(playerX, playerY);
    let mousePosition = new Vec2(mouseX, mouseY);
    let playerPosition = new Vec2(playerX, playerY);
    let directionVector = mousePosition.sub(playerPosition).normalise().scale(DIRECTION_VECTOR_SCALE);
    context.lineWidth = 3;
    context.lineTo(playerPosition.x + directionVector.x, playerPosition.y + directionVector.y);
    context.stroke();
    // debug(`MouseX: ${mousePosition.x}, MouseY: ${mousePosition.y}`);

    let temp = horizontalIntersectionScan(directionVector.normalise());
    temp.forEach((pos) =>{
        drawCircle(pos, 10);
    })
}

function getCellTopLeftCoord(row, col){
    if(row >= 0 && row < map.length && col >= 0 && col < map[0].length){
        return new Vec2(GRID_OFFSET + row*CELL_HEIGHT, GRID_OFFSET + col*CELL_WIDTH);
    }

    return new Vec2(-1, -1);
}

function getCellCentreCoord(row, col){
    if(row >= 0 && row < map.length && col >= 0 && col < map[0].length){
        return new Vec2(GRID_OFFSET + row*CELL_HEIGHT + CELL_HEIGHT/2, GRID_OFFSET + col*CELL_WIDTH + CELL_WIDTH/2);
    }

    return new Vec2(-1, -1);
}

function horizontalIntersectionScan(ray){
    let horizontalIntersections = [];
    let currentPos = new Vec2(playerX, playerY);
    ray = ray.normalise();

    const theta = Math.acos(ray.dot(new Vec2(1, 0)));
    // Ray facing up
    if(ray.y < 0)
    {
        let y = currentPos.y % CELL_HEIGHT;
        let nextPos = currentPos.add(new Vec2(y / Math.tan(theta), -y));
        if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
            currentPos = nextPos;
            horizontalIntersections.push(currentPos);
        }
        while (currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
            nextPos = currentPos.add(new Vec2(CELL_HEIGHT / Math.tan(theta), -CELL_HEIGHT));
            if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                horizontalIntersections.push(nextPos);
            }
            currentPos = nextPos;
        }
    }

    // Ray facing down
    else if (ray.y > 0){
        let y = CELL_HEIGHT - (currentPos.y % CELL_HEIGHT);
        let nextPos = currentPos.add(new Vec2(y / Math.tan(theta), y));
        if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
            currentPos = nextPos;
            horizontalIntersections.push(currentPos);
        }
        while (currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
            nextPos = currentPos.add(new Vec2(CELL_HEIGHT / Math.tan(theta), CELL_HEIGHT));
            if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                horizontalIntersections.push(nextPos);
            }
            currentPos = nextPos;
        }
    }


    return horizontalIntersections
}

function drawCircle(centre, radius){
    context.beginPath();
    context.arc(...centre.asArray(), radius, 0, 2*Math.PI);
    context.fillStyle = "purple";
    context.fill();
    context.stroke()
}

function debug(text){
    let debug_label = document.getElementById("debug-box");
    debug_label.innerHTML = text;
}

function update()
{
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(6, 6);
    drawPlayerLocation();
    context.closePath();
}

setInterval(update, 1000/60);

document.addEventListener("mousemove", (event)=>{
    mouseX = event.offsetX;
    mouseY = event.offsetY;
})

