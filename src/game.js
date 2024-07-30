const GRID_OFFSET = 0;
const DIRECTION_VECTOR_SCALE = 75;
let canvas = document.getElementById("main-canvas");
let render = document.getElementById("render-canvas");

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;
render.height = 800;
render.width = 1100;
canvas.width = 800;
canvas.height = 800;
let playerX = 275;
let playerY = 420;
let mouseX = 0;
let mouseY = 0;
let context = canvas.getContext("2d");
let keyState = {"w": false, "a": false, "s": false, "d":false};

// Warning: Map must have square dimensions
let map = [
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
           [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
           [1, 1, 0, 1, 0, 0, 0, 0, 0, 1],
           [1, 1, 0, 0, 0, 1, 0, 0, 0, 1],
           [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
           [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
           [1, 1, 0, 0, 0, 1, 0, 0, 0, 1],
           [1, 1, 0, 0, 1, 0, 0, 0, 0, 1],
           [1, 1, 0, 0, 1, 0, 0, 0, 0, 1],
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          ];

const CELL_WIDTH = Math.floor(canvas.width / map[0].length);
const CELL_HEIGHT = Math.floor(canvas.height / map.length);
const MAX_ROW = map[0].length;
const MAX_COL = map.length;

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

    distanceTo(otherVec2){
        return Math.sqrt(Math.pow(otherVec2.x - this.x, 2) + Math.pow(otherVec2.y - this.y, 2));
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

    let h = 0;
    let w = 0;

    for (let row = 0; row < MAX_ROW; row++) {
        for(let col=0; col< MAX_COL; col++){
            if(map[row][col] === 1)
            {
                topLeftX = col*CELL_WIDTH;
                topLeftY = row*CELL_HEIGHT;
                context.fillStyle = "red";
                context.fillRect(topLeftX, topLeftY, CELL_WIDTH, CELL_HEIGHT);
            }
        }
    }

    for(let i=0; i<=MAX_ROW; i++)
    {
        context.moveTo(0, h)
        context.lineTo((CELL_WIDTH*MAX_COL), h)
        context.stroke();
        h += CELL_HEIGHT;
    }

    for(let i=0; i<=MAX_COL; i++)
    {
        context.moveTo(w, 0);
        context.lineTo(w, (CELL_HEIGHT*MAX_ROW));
        context.stroke();
        w += CELL_WIDTH
    }

    context.closePath();
}

function drawPlayerLocation()
{
    let mousePosition = new Vec2(mouseX, mouseY);
    let playerPosition = new Vec2(playerX, playerY);
    let directionVector = mousePosition.sub(playerPosition).normalise().scale(DIRECTION_VECTOR_SCALE);

    drawCircle(playerPosition, 10, "blue");

    let horizontalInterSectionLocation = horizontalIntersectionScan(directionVector.normalise());
    let verticalInterSectionLocation = verticalIntersectionScan(directionVector.normalise());
    let distanceToHorizontalIntersection = NaN;
    let distanceToVerticalIntersection = NaN;

    if(horizontalInterSectionLocation.length > 0){
        distanceToHorizontalIntersection = playerPosition.distanceTo(horizontalInterSectionLocation[0]);
    }
    else{
        distanceToHorizontalIntersection = Infinity;
    }

    if(verticalInterSectionLocation.length > 0){
        distanceToVerticalIntersection = playerPosition.distanceTo(verticalInterSectionLocation[0]);
    }
    else{
        distanceToVerticalIntersection = Infinity;
    }
    
    // (distanceToHorizontalIntersection < distanceToVerticalIntersection) ? drawCircle(temp[0], 10) : 
    //                                                                       (distanceToVerticalIntersection !== Infinity) ? drawCircle(temp2[0], 10, "green"):
    //                                                                       {};
    (distanceToHorizontalIntersection < distanceToVerticalIntersection) ? drawLine(playerPosition, horizontalInterSectionLocation[0], 2) : 
                                                                          (distanceToVerticalIntersection !== Infinity) ? drawLine(playerPosition, verticalInterSectionLocation[0], 2):
                                                                          {};

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

function getCell(position){
    if(position.x >=0 && position.x <= canvas.width && position.y >=0 && position.y <= canvas.height)
    {
        let row = Math.floor(position.y / CELL_HEIGHT);
        let col = Math.floor(position.x / CELL_WIDTH);
        if(row < MAX_ROW && col < MAX_COL){
            return new Vec2(col, row);
        }
    }

    // TODO: replace this with a thrown error
    return new Vec2(-1, -1);
}

function getCellValue(location){
    if(location.x >=0 && location.x < MAX_COL && location.y >=0 && location.y < MAX_ROW){
        return map[location.y][location.x];
    }
    return -1;
}

function horizontalIntersectionScan(ray){
    // TODO: only add intersection point that intersects a wall, break out of loop once the first wall intersection is found
    let horizontalIntersections = [];
    let currentPos = new Vec2(playerX, playerY);
    ray = ray.normalise();

    const theta = Math.acos(ray.dot(new Vec2(1, 0)));
    // Ray facing up
    if(ray.y < 0)
    {
        let y = currentPos.y % CELL_HEIGHT;
        let nextPos = currentPos.add(new Vec2(y / Math.tan(theta), -y));
        if (hasIntersectedWithWall(nextPos, "horizontal") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
            horizontalIntersections.push(nextPos);
        }
        else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
            currentPos = nextPos;
            while (!hasIntersectedWithWall(currentPos, "horizontal") && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                nextPos = currentPos.add(new Vec2(CELL_HEIGHT / Math.tan(theta), -CELL_HEIGHT));
                if (hasIntersectedWithWall(nextPos, "horizontal") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                    horizontalIntersections.push(nextPos);
                    break;
                }
                currentPos = nextPos;
            }
        }

    }

    // Ray facing down
    else if (ray.y > 0){
        let y = CELL_HEIGHT - (currentPos.y % CELL_HEIGHT);
        let nextPos = currentPos.add(new Vec2(y / Math.tan(theta), y));
        if (hasIntersectedWithWall(nextPos, "horizontal") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
            horizontalIntersections.push(nextPos);
        }
        else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
            currentPos = nextPos;
            while (!hasIntersectedWithWall(currentPos, "horizontal") && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                nextPos = currentPos.add(new Vec2(CELL_HEIGHT / Math.tan(theta), CELL_HEIGHT));
                if (hasIntersectedWithWall(nextPos, "horizontal") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                    horizontalIntersections.push(nextPos);
                    break;
                }
                currentPos = nextPos;
            }
        }
    }

    return horizontalIntersections
}

function verticalIntersectionScan(ray){
    let verticalIntersections = [];
    let currentPos = new Vec2(playerX, playerY);
    ray = ray.normalise();

    const theta = Math.acos(ray.dot(new Vec2(1, 0)));
    // Ray facing up
    if(ray.y < 0)
    {
        // Ray facing right
        if(theta < (Math.PI/2)){
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(CELL_WIDTH - x, -(CELL_WIDTH - x) * Math.tan(theta)));
            if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                verticalIntersections.push(nextPos);
            }
            else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
                currentPos = nextPos;
                while (!hasIntersectedWithWall(currentPos, "vertical") && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(CELL_WIDTH, -(CELL_WIDTH * Math.tan(theta))));
                    if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        verticalIntersections.push(nextPos);
                        break;
                    }
                    currentPos = nextPos;
                }
            }   
        }

        // Ray facing left
        else if (theta > (Math.PI/2))
        {
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(-x, x * Math.tan(theta)));
            if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                verticalIntersections.push(nextPos);
            }
            else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
                currentPos = nextPos;
                while (!hasIntersectedWithWall(currentPos, "vertical") && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(-CELL_WIDTH, (CELL_WIDTH * Math.tan(theta))));
                    if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        verticalIntersections.push(nextPos);
                        break;
                    }
                    currentPos = nextPos;
                }
            }
        }
        
    }

    // Ray facing down
    else if (ray.y > 0){
        // Ray facing right
        if(theta < (Math.PI/2)){
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(CELL_WIDTH - x, (CELL_WIDTH - x) * Math.tan(theta)));
            if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                verticalIntersections.push(nextPos);
            }
            else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
                currentPos = nextPos;
                while (!hasIntersectedWithWall(currentPos, "vertical") && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(CELL_WIDTH, (CELL_WIDTH * Math.tan(theta))));
                    if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        verticalIntersections.push(nextPos);
                        break;
                    }
                    currentPos = nextPos;
                }
            }
        }

        // Ray facing left
        else if(theta > (Math.PI/2)){
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(-x, -x*Math.tan(theta)));
            // TODO: Fix possible bug, what if the players initial position is intersecting a wall, currently not checking for that.
            if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                verticalIntersections.push(nextPos);
            }
            else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
                currentPos = nextPos;
                while (!hasIntersectedWithWall(currentPos, "vertical") && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(-CELL_WIDTH, -(CELL_WIDTH * Math.tan(theta))));
                    if (hasIntersectedWithWall(nextPos, "vertical") && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        verticalIntersections.push(nextPos);
                        break;
                    }
                    currentPos = nextPos;
                }
            }
        }
    }

    return verticalIntersections
}

function hasIntersectedWithWall(intersection_position, type="horizontal"){
    // TODO: handle case where intersection point is at the corner of four cells
    return (type.toLowerCase() == "horizontal") ? hasIntersectedWithWallHorizontal(intersection_position) : hasIntersectedWithWallVertical(intersection_position);
}

function hasIntersectedWithWallHorizontal(intersection_position){
    let topCell = getCell(intersection_position.sub(new Vec2(0, 10)));
    let bottomCell = getCell(intersection_position.add(new Vec2(0, 10)));
    if (topCell.x !== -1 && topCell.y !== -1) {
        if (getCellValue(topCell) === 1) {
            return true;
        }
    }
    if (bottomCell.x !== -1 && bottomCell.y !== -1) {
        if (getCellValue(bottomCell) === 1) {
            return true;
        }
    }
    return false;
}

function hasIntersectedWithWallVertical(intersection_position){
    let leftCell = getCell(intersection_position.sub(new Vec2(10, 0)));
    let rightCell = getCell(intersection_position.add(new Vec2(10, 0)));
    if(leftCell.x !== -1 && leftCell.y !== -1){
        if(getCellValue(leftCell) === 1){
            return true;
        }
    }
    if(rightCell.x !== -1 && rightCell.y !== -1){
        if(getCellValue(rightCell) === 1){
            return true;
        }
    }

    return false;
}

function drawCircle(centre, radius, colour="purple"){
    context.beginPath();
    context.arc(...centre.asArray(), radius, 0, 2*Math.PI);
    context.fillStyle = colour;
    context.fill();
    context.stroke()
}

function drawLine(start, end, thickness=1){
    context.beginPath();
    context.moveTo(...start.asArray());
    context.lineTo(...end.asArray());
    context.lineWidth = thickness;
    context.stroke();
}

function debug(text){
    let debug_label = document.getElementById("debug-box");
    debug_label.innerHTML = text;
}

function updatePlayerPosition(){
    const SPEED = 5;
    if(keyState.w){ playerY -= SPEED}
    else if (keyState.a) { playerX -= SPEED}
    else if (keyState.s) { playerY += SPEED}
    else if (keyState.d) { playerX += SPEED}

    //playerX = Math.abs(playerX % canvas.width);
    //playerY = Math.abs(playerY % canvas.height);
}

function update()
{
    // TODO: Add keyboard/mouse input and update player movement/collisions
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(6, 6);
    updatePlayerPosition();
    drawPlayerLocation();
    context.closePath();
}

setInterval(update, 1000/60);

document.addEventListener("mousemove", (event)=>{
    mouseX = event.offsetX;
    mouseY = event.offsetY;
});

document.addEventListener("keydown", (event) =>{
    if(event.key === "w") {
        keyState.w = true;
    }
    else if(event.key === "a"){
        keyState.a = true;
    }
    else if(event.key === "s"){
        keyState.s = true;
    }
    else if (event.key === "d") {
        keyState.d = true;
    }
});

document.addEventListener("keyup", (event) =>{
    if(event.key === "w") {
        keyState.w = false;
    }
    else if(event.key === "a"){
        keyState.a = false;
    }
    else if(event.key === "s"){
        keyState.s = false;
    }
    else if (event.key === "d") {
        keyState.d = false;
    }
});


