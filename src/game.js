const GRID_OFFSET = 0;
const DIRECTION_VECTOR_SCALE = 75;
const FOV = 60;
let canvas = document.getElementById("main-canvas");
let render = document.getElementById("render-canvas");

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

    rotate(angle){
        let radian_angle = angle * (Math.PI/180);
        let new_x = (this.x * Math.cos(radian_angle)) - (this.y * Math.sin(radian_angle)); 
        let new_y = (this.x * Math.sin(radian_angle)) + (this.y * Math.cos(radian_angle)); 
        return new Vec2(new_x, new_y);
    }

    equals(otherVec2){
        return this.x === otherVec2.x && this.y === otherVec2.y;
    }

    copy(){
        return new Vec2(this.x, this.y);
    }

    asArray(){
        return [this.x, this.y];
    }
    
    toString(){
        return `${this.x},${this.y}`;
    }
};

class Player{

    constructor(position, direction, collision_radius=12){
        this.position = position;
        this.direction = direction.normalise();
        this.collision_radius = collision_radius;
    }

    getPosition(){
        return new this.position.copy();
    }
    translate(speed){
        this.position = this.position.add(this.direction.scale(speed));
    }

    rotate(angle){
        this.direction = this.direction.rotate(angle).normalise();
    }

    copy(){
        return new Player(this.position, this.direction, this.collision_radius);
    }
};

function createEnum(e){
    // Work around for creating enums from JS objects: https://masteringjs.io/tutorials/fundamentals/enum 
    const immutableEnum = {};
    for(let key in e){
        immutableEnum[key] = e[key];
    }
    return Object.freeze(immutableEnum);
}

render.height = 800;
render.width = 1100;
canvas.width = 800;
canvas.height = 800;
let player = new Player(new Vec2(275, 420), new Vec2(1, 1));
let context = canvas.getContext("2d");
let renderCtx = render.getContext("2d");
let keyState = {"w": false, "a": false, "s": false, "d":false};

// Warning: Map must have square dimensions
let map = [
           [1, 2, 3, 4, 5, 6, 7, 1, 2, 3],
           [2, 0, 0, 5, 0, 0, 0, 0, 0, 2],
           [3, 1, 0, 6, 0, 0, 0, 0, 0, 4],
           [4, 7, 0, 0, 0, 4, 0, 0, 0, 5],
           [5, 0, 0, 0, 0, 1, 0, 0, 0, 6],
           [6, 0, 0, 0, 0, 0, 0, 0, 0, 7],
           [7, 4, 0, 0, 0, 2, 0, 0, 0, 1],
           [1, 5, 0, 0, 1, 0, 0, 0, 0, 2],
           [2, 6, 0, 0, 7, 0, 0, 0, 0, 3],
           [3, 2, 3, 4, 5, 6, 7, 1, 2, 4],
          ];

const CELL_WIDTH = Math.floor(canvas.width / map[0].length);
const CELL_HEIGHT = Math.floor(canvas.height / map.length);
const MAX_ROW = map[0].length;
const MAX_COL = map.length;
const MUTABLE_COLOUR_ENUM = {1: "red", 2: "orange", 3: "yellow", 4: "green", 5: "blue", 6: "indigo", 7: "#7F00FF"};
const IMMUTABLE_COLOUR_ENUM = createEnum(MUTABLE_COLOUR_ENUM);


function drawGrid()
{
    context.beginPath();
    context.lineWidth = 1;

    let h = 0;
    let w = 0;

    for (let row = 0; row < MAX_ROW; row++) {
        for(let col=0; col< MAX_COL; col++){
            if(map[row][col] > 0)
            {
                topLeftX = col*CELL_WIDTH;
                topLeftY = row*CELL_HEIGHT;
                // context.fillStyle = "red";
                context.fillStyle = IMMUTABLE_COLOUR_ENUM[map[row][col]];
                context.fillRect(topLeftX, topLeftY, CELL_WIDTH, CELL_HEIGHT);
            }
        }
    }

    context.strokeStyle = "black"

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
    // drawFillCircle(playerPosition, 10, "blue");
    drawFillCircle(player.position, 10, "blue");
}

function getCellTopLeftCoord(row, col){
    if(row >= 0 && row < map.length && col >= 0 && col < map[0].length){
        return new Vec2(GRID_OFFSET + row*CELL_HEIGHT, GRID_OFFSET + col*CELL_WIDTH);
    }

    return new Vec2(-1, -1);
}

function getCellCentreCoord(col, row){
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
    let currentPos = player.position;
    ray = ray.normalise();

    const theta = Math.acos(ray.dot(new Vec2(1, 0)));
    // Ray facing up
    if(ray.y < 0)
    {
        let y = currentPos.y % CELL_HEIGHT;
        let nextPos = currentPos.add(new Vec2(y / Math.tan(theta), -y));
        let intersectionCellObject = hasIntersectedWithWall(nextPos, "horizontal");
        if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
            return {...intersectionCellObject, "intersection_location": nextPos};
        }
        else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
            currentPos = nextPos;
            intersectionCellObject = hasIntersectedWithWall(nextPos, "horizontal");
            while (!intersectionCellObject && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                nextPos = currentPos.add(new Vec2(CELL_HEIGHT / Math.tan(theta), -CELL_HEIGHT));
                intersectionCellObject = hasIntersectedWithWall(nextPos, "horizontal");
                if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                    return {...intersectionCellObject, "intersection_location": nextPos};
                    // return nextPos;
                }
                currentPos = nextPos;
            }
        }

    }

    // Ray facing down
    else if (ray.y > 0){
        let y = CELL_HEIGHT - (currentPos.y % CELL_HEIGHT);
        let nextPos = currentPos.add(new Vec2(y / Math.tan(theta), y));
        let intersectionCellObject = hasIntersectedWithWall(nextPos, "horizontal");
        if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
            return {...intersectionCellObject, "intersection_location": nextPos};
            // return nextPos;
        }
        else if(nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height){
            currentPos = nextPos;
            intersectionCellObject = hasIntersectedWithWall(nextPos, "horizontal");
            while (!intersectionCellObject && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                nextPos = currentPos.add(new Vec2(CELL_HEIGHT / Math.tan(theta), CELL_HEIGHT));
                intersectionCellObject = hasIntersectedWithWall(nextPos, "horizontal");
                if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                    return {...intersectionCellObject, "intersection_location": nextPos};
                    // return nextPos
                }
                currentPos = nextPos;
            }
        }
    }

    // TODO: possibly throw error instead
    // return new Vec2(-1, -1);
    return null;
}

function verticalIntersectionScan(ray) {
    let currentPos = player.position;
    ray = ray.normalise();

    const theta = Math.acos(ray.dot(new Vec2(1, 0)));
    // Ray facing up
    if (ray.y < 0) {
        // Ray facing right
        if (theta < (Math.PI / 2)) {
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(CELL_WIDTH - x, -(CELL_WIDTH - x) * Math.tan(theta)));
            let intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
            if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                return { ...intersectionCellObject, "intersection_location": nextPos };
                // return nextPos;
            }
            else if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                currentPos = nextPos;
                intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                while (!intersectionCellObject && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(CELL_WIDTH, -(CELL_WIDTH * Math.tan(theta))));
                    intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                    if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        return { ...intersectionCellObject, "intersection_location": nextPos };
                        // return nextPos;
                    }
                    currentPos = nextPos;
                }
            }
        }

        // Ray facing left
        else if (theta > (Math.PI / 2)) {
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(-x, x * Math.tan(theta)));
            let intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
            if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                return { ...intersectionCellObject, "intersection_location": nextPos };
                // return nextPos;
            }
            else if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                currentPos = nextPos;
                intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                while (!intersectionCellObject && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(-CELL_WIDTH, (CELL_WIDTH * Math.tan(theta))));
                    intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                    if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        return { ...intersectionCellObject, "intersection_location": nextPos };
                        // return nextPos;
                    }
                    currentPos = nextPos;
                }
            }
        }

    }

    // Ray facing down
    else if (ray.y > 0) {
        // Ray facing right
        if (theta < (Math.PI / 2)) {
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(CELL_WIDTH - x, (CELL_WIDTH - x) * Math.tan(theta)));
            let intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
            if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                return { ...intersectionCellObject, "intersection_location": nextPos };
                // return nextPos;
            }
            else if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                currentPos = nextPos;
                intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                while (!intersectionCellObject && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(CELL_WIDTH, (CELL_WIDTH * Math.tan(theta))));
                    intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                    if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        return { ...intersectionCellObject, "intersection_location": nextPos };
                        // return nextPos;
                    }
                    currentPos = nextPos;
                }
            }
        }

        // Ray facing left
        else if (theta > (Math.PI / 2)) {
            let x = currentPos.x % CELL_WIDTH;
            let nextPos = currentPos.add(new Vec2(-x, -x * Math.tan(theta)));
            let intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
            // TODO: Fix possible bug, what if the players initial position is intersecting a wall, currently not checking for that.
            if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                return { ...intersectionCellObject, "intersection_location": nextPos };
                // return nextPos;
            }
            else if (nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                currentPos = nextPos;
                intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                while (!intersectionCellObject && currentPos.x > 0 && currentPos.x < canvas.width && currentPos.y > 0 && currentPos.y < canvas.height) {
                    nextPos = currentPos.add(new Vec2(-CELL_WIDTH, -(CELL_WIDTH * Math.tan(theta))));
                    intersectionCellObject = hasIntersectedWithWall(nextPos, "vertical");
                    if (intersectionCellObject && nextPos.x > 0 && nextPos.x < canvas.width && nextPos.y > 0 && nextPos.y < canvas.height) {
                        return { ...intersectionCellObject, "intersection_location": nextPos };
                        // return nextPos;
                    }
                    currentPos = nextPos;
                }
            }
        }

    }
    // return new Vec2(-1, -1);
    return null;
}

function hasIntersectedWithWall(intersection_position, type="horizontal"){
    // TODO: handle case where intersection point is at the corner of four cells
    return (type.toLowerCase() == "horizontal") ? hasIntersectedWithWallHorizontal(intersection_position) : hasIntersectedWithWallVertical(intersection_position);
}

function hasIntersectedWithWallHorizontal(intersection_position){
    let topCell = getCell(intersection_position.sub(new Vec2(0, 10)));
    let bottomCell = getCell(intersection_position.add(new Vec2(0, 10)));
    if (topCell.x !== -1 && topCell.y !== -1) {
        if (getCellValue(topCell) > 0) {
            return {"value": getCellValue(topCell), "centre": getCellCentreCoord(...topCell.asArray())}
            // return true;
        }
    }
    if (bottomCell.x !== -1 && bottomCell.y !== -1) {
        if (getCellValue(bottomCell) > 0) {
            return {"value": getCellValue(bottomCell), "centre": getCellCentreCoord(...bottomCell.asArray())}
            // return true;
        }
    }
    // return false;
    return null;
}

function hasIntersectedWithWallVertical(intersection_position){
    let leftCell = getCell(intersection_position.sub(new Vec2(10, 0)));
    let rightCell = getCell(intersection_position.add(new Vec2(10, 0)));
    if(leftCell.x !== -1 && leftCell.y !== -1){
        if(getCellValue(leftCell) > 0){
            return {"value": getCellValue(leftCell), "centre": getCellCentreCoord(...leftCell.asArray())}
            // return true;
        }
    }
    if(rightCell.x !== -1 && rightCell.y !== -1){
        if(getCellValue(rightCell) > 0){
            return {"value": getCellValue(rightCell), "centre": getCellCentreCoord(...rightCell.asArray())}
            // return true;
        }
    }

    // return false;
    return null;
}

function castRay(player, angle){
    let rayDirection = player.direction.rotate(angle).normalise();
    let horizontalInterSectionObject = horizontalIntersectionScan(rayDirection);
    let verticalInterSectionObject = verticalIntersectionScan(rayDirection);
    let distanceToHorizontalIntersection = NaN;
    let distanceToVerticalIntersection = NaN;

    if (horizontalInterSectionObject !== null) {
        distanceToHorizontalIntersection = player.position.distanceTo(horizontalInterSectionObject["intersection_location"]);
    }
    else {
        distanceToHorizontalIntersection = Infinity;
    }

    if (verticalInterSectionObject !== null) {
        distanceToVerticalIntersection = player.position.distanceTo(verticalInterSectionObject["intersection_location"]);
    }
    else {
        distanceToVerticalIntersection = Infinity;
    }

    // (distanceToHorizontalIntersection < distanceToVerticalIntersection) ? drawFillCircle(temp[0], 10) : 
    //                                                                       (distanceToVerticalIntersection !== Infinity) ? drawFillCircle(temp2[0], 10, "green"):
    //                                                                       {};

    // (distanceToHorizontalIntersection < distanceToVerticalIntersection) ? drawLine(playerPosition, horizontalInterSectionLocation, "yellow", 2) :
    //     (distanceToVerticalIntersection !== Infinity) ? drawLine(playerPosition, verticalInterSectionLocation, "yellow", 2) :
    //         {};
    
    const finalIntersectionObjectHorizontal = {...horizontalInterSectionObject, "perpendicular_intersection_distance": distanceToHorizontalIntersection * Math.cos(degreeToRadian(angle))};
    const finalIntersectionObjectVertical = {...verticalInterSectionObject, "perpendicular_intersection_distance": distanceToVerticalIntersection * Math.cos(degreeToRadian(angle))};

    if(horizontalInterSectionObject !== null && verticalInterSectionObject !== null){
        // return (distanceToHorizontalIntersection < distanceToVerticalIntersection) ? distanceToHorizontalIntersection * Math.cos(degreeToRadian(angle)) : distanceToVerticalIntersection * Math.cos(degreeToRadian(angle));
        return (distanceToHorizontalIntersection < distanceToVerticalIntersection) ? finalIntersectionObjectHorizontal: finalIntersectionObjectVertical;
    }
    else if (horizontalInterSectionObject !== null){
        // return distanceToHorizontalIntersection * Math.cos(degreeToRadian(angle)) 
        return finalIntersectionObjectHorizontal;
    }
    else if (verticalInterSectionObject !== null){
        // return distanceToVerticalIntersection * Math.cos(degreeToRadian(angle))
        return finalIntersectionObjectVertical;
    }

    else { return null; }

}

function drawFillCircle(centre, radius, colour="purple"){
    context.beginPath();
    context.arc(...centre.asArray(), radius, 0, 2*Math.PI);
    context.fillStyle = colour;
    context.fill();
    context.stroke()
}

function drawCircle(centre, radius, colour="purple"){
    context.beginPath();
    context.arc(...centre.asArray(), radius, 0, 2*Math.PI);
    context.strokeStyle = colour;
    context.stroke()
}

function drawLine(start, end, colour="black", thickness=1, ctx=context){
    ctx.beginPath();
    ctx.moveTo(...start.asArray());
    ctx.lineTo(...end.asArray());
    ctx.lineWidth = thickness;
    ctx.strokeStyle = colour;
    ctx.stroke();
}

function drawRect(start, w, h, colour = "white", ctx=context){
    ctx.beginPath();
    ctx.rect(...start.asArray(), w, h);
    ctx.strokeStyle = colour;
    ctx.fill();
}

function debug(text){
    let debug_label = document.getElementById("debug-box");
    debug_label.innerHTML = text;
}

function degreeToRadian(angle){
    return angle * (Math.PI / 180);
}

function isPlayerCollidingWithWall(player){
    // TODO: throw error is player is null
    if(player){
        for (let theta = 0; theta < 360; theta++) {
            const x = player.position.x + (player.collision_radius * Math.cos(theta));
            const y = player.position.y + (player.collision_radius * Math.sin(theta));
            const point = new Vec2(x, y);
            const cell = getCell(point);
            if (!cell.equals(new Vec2(-1, -1)) && getCellValue(cell) > 0) {
                return true;
            }
        }
    }
    return false;
}

function updatePlayerPosition(){
    /* TODO: Add collision detection. Check if new position will place the player into a "walled" cell before updating position.
       add a second invisible circle for collision detection move in steps of 1 degree and check if any point of the circle (using circle equation)
       collides with an occupied cell

       TODO: find out if updating x or y component is causing collision and only move in the component direction not causing a collision
    */
    const SPEED = 5;
    const testPlayer = player.copy();
    if(keyState.w){
        if (!isPlayerCollidingWithWall(player)){
            testPlayer.translate(SPEED);
            if(!isPlayerCollidingWithWall(testPlayer)){
                player.translate(SPEED);
            }
        }
        else{
            player.translate(-5);
        }
    }
    else if(keyState.s){
        if(!isPlayerCollidingWithWall(player)){
            testPlayer.translate(-1 * SPEED);
            if(!isPlayerCollidingWithWall(testPlayer)){
                player.translate(-1 * SPEED)
            }
        }
        else{
            player.translate(5);
        }
    }
}

function updatePlayerDirection(){
    const ROTATION_SPEED = 1;
    if(keyState.a){player.rotate(-ROTATION_SPEED)}
    else if (keyState.d) {player.rotate(ROTATION_SPEED)}
}

function render3DWall(distanceToWall, x, w, c="black"){
    let lineHeight = Math.min(((CELL_WIDTH * render.height) / distanceToWall), render.height);
    let drawStartHeight = Math.max((render.height/2) - (lineHeight/2), 0);
    let drawEndHeight = Math.min((render.height/2) + (lineHeight/2), (render.height-1));
    let drawStart = new Vec2(x, drawStartHeight);
    let drawEnd = new Vec2(x, drawEndHeight);
    drawLine(drawStart, drawEnd, c, w, renderCtx);
}

function renderFloor(x, startHeight){ 
    let drawStart = new Vec2(x, startHeight); 
    let drawEnd = new Vec2(x, render.height); 
    const greyColourHexCode = "#c7c3b9"; 
    drawLine(drawStart, drawEnd, greyColourHexCode, 1, renderCtx);
}

function update()
{
    context.clearRect(0, 0, canvas.width, canvas.height);
    renderCtx.clearRect(0, 0, render.width, render.height);
    drawGrid(6, 6);
    updatePlayerDirection();
    updatePlayerPosition();
    drawPlayerLocation();

    // draw direction ray
    drawLine(player.position, player.position.add(player.direction.normalise().scale(50)), "black", 2, context);

    // draw collision circle
    drawCircle(player.position, player.collision_radius, "purple");

    // Cast rays
    const stripWidth = Math.ceil(render.width/Math.floor(FOV));
    // Note: This solution of iterating by fractions of a degree improves graphics but affects performance
    for(let i=-Math.floor(FOV/2); i<Math.floor(FOV/2); i+= (1/4)){
        const intersectionObject = castRay(player, i);
        if (intersectionObject) {
            let distanceToWall = intersectionObject["perpendicular_intersection_distance"];
            if (isFinite(distanceToWall)) {
                // Note: DO NOT REMOVE BRACKETS! Doing so will affect order of operations
                render3DWall(distanceToWall, ((i + Math.floor(FOV / 2)) * stripWidth), (stripWidth / 4) + 1, IMMUTABLE_COLOUR_ENUM[intersectionObject["value"]]);
            }
        }
    }

    renderCtx.closePath()
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
    else if (event.key === "a") {
        keyState.a = true;
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
    else if (event.key === "a") {
        keyState.a = false;
    }
    else if (event.key === "d") {
        keyState.d = false;
    }
});

