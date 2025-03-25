const mapCanvas = document.getElementById("mapCanvas");
const ctx = mapCanvas.getContext("2d");
const backgroundCanvas = document.getElementById("backgroundCanvas");
const backgroundCtx = backgroundCanvas.getContext("2d");
const tilesCanvas = document.getElementById("tilesCanvas");
const tilesCtx = tilesCanvas.getContext("2d");
const foregroundCanvas = document.getElementById("foregroundCanvas");
const foregroundCtx = foregroundCanvas.getContext("2d");
const previewCanvas = document.getElementById("previewCanvas");
const previewCtx = previewCanvas.getContext("2d");
const canvasSpacer = document.getElementById("canvasSpacer");

const selectedTileText = document.getElementById("selectedTile");
const eraseModeText = document.getElementById("eraseModeText");
const activeToolText = document.getElementById("activeTool");
const mapRowsInput = document.getElementById("mapRows");
const mapColumnsInput = document.getElementById("mapColumns");
const applySizeBtn = document.getElementById("applySizeBtn");
const opacitySlider = document.getElementById("imageOpacity");
const opacityValue = document.getElementById("opacityValue");

const tileSize = 16;

let rows = parseInt(mapRowsInput.value);
let columns = parseInt(mapColumnsInput.value);
let mapData = [];

let eraseMode = false;
let isDrawing = false;
let selectedTile = "1"; // Default tile type
let activeTool = "brush"; // Default tool

// For line and rectangle drawing
let startX = null;
let startY = null;

// Background image objects
let backgroundImage = null;
let tilesImage = null;
let foregroundImage = null;

function initializeMap() {
    rows = parseInt(mapRowsInput.value);
    columns = parseInt(mapColumnsInput.value);
    mapData = Array(rows).fill().map(() => Array(columns).fill("0"));
    resizeCanvases();
    drawGrid();
}

function resizeCanvases() {
    const labelSpace = 20; // Space for row/column numbers
    const width = columns * tileSize + labelSpace;
    const height = rows * tileSize + labelSpace;
    
    // Set all canvases to the same size
    mapCanvas.width = width;
    mapCanvas.height = height;
    backgroundCanvas.width = width;
    backgroundCanvas.height = height;
    tilesCanvas.width = width;
    tilesCanvas.height = height;
    foregroundCanvas.width = width;
    foregroundCanvas.height = height;
    previewCanvas.width = width;
    previewCanvas.height = height;
    
    // Set spacer size to ensure the container has the right dimensions
    canvasSpacer.style.width = width + "px";
    canvasSpacer.style.height = height + "px";
    
    // Redraw all layers
    drawBackgroundLayers();
    drawGrid();
}

function setActiveTool(tool) {
    activeTool = tool;
    activeToolText.innerText = tool.charAt(0).toUpperCase() + tool.slice(1);
    
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tool + 'Tool').classList.add('active');
}

document.getElementById('brushTool').addEventListener('click', () => setActiveTool('brush'));
document.getElementById('lineTool').addEventListener('click', () => setActiveTool('line'));
document.getElementById('rectTool').addEventListener('click', () => setActiveTool('rect'));
document.getElementById('fillRectTool').addEventListener('click', () => setActiveTool('fillRect'));
document.getElementById('fillTool').addEventListener('click', () => setActiveTool('fill'));

function drawGrid() {
    const labelSpace = 20; // Space for row/column numbers
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    ctx.font = "12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw column numbers (X-axis)
    for (let x = 0; x < columns; x++) {
        if (x % 5 === 0) { // Only show every 5th label to avoid crowding
            let textX = x * tileSize + tileSize / 2 + labelSpace;
            ctx.fillText(x, textX, labelSpace / 2);
        }
    }

    // Draw row numbers (Y-axis)
    ctx.textAlign = "right";
    for (let y = 0; y < rows; y++) {
        if (y % 5 === 0) { // Only show every 5th label to avoid crowding
            let textY = y * tileSize + tileSize / 2 + labelSpace;
            ctx.fillText(y, labelSpace - 5, textY);
        }
    }

    // Reset text alignment before drawing grid
    ctx.textAlign = "center";

    // Draw grid and tiles
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            let drawX = x * tileSize + labelSpace;
            let drawY = y * tileSize + labelSpace;

            ctx.strokeStyle = "#ddd";
            ctx.strokeRect(drawX, drawY, tileSize, tileSize);
            drawTile(ctx, x, y, mapData[y][x], drawX, drawY);
        }
    }
}

function drawTile(context, x, y, type, drawX, drawY) {
    if (type === "1") context.fillStyle = "rgba(165, 42, 42, 0.7)"; // Floor (brown with transparency)
    else if (type === "2") context.fillStyle = "rgba(0, 0, 255, 0.7)"; // Platform (blue with transparency)
    else if (type === "3") context.fillStyle = "rgba(128, 128, 128, 0.7)"; // Wall (gray with transparency)
    else if (type === "4") context.fillStyle = "rgba(128, 0, 128, 0.7)"; // Cutscene (purple with transparency)
    else if (type === "5") context.fillStyle = "rgba(0, 128, 0, 0.7)"; // Ladder (green with transparency)
    else return;
    context.fillRect(drawX, drawY, tileSize, tileSize);
}

function drawBackgroundLayers() {
    const opacity = parseFloat(opacitySlider.value);
    const labelSpace = 20;
    
    // Clear all background canvases
    backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    tilesCtx.clearRect(0, 0, tilesCanvas.width, tilesCanvas.height);
    foregroundCtx.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);
    
    // Draw background image if available
    if (backgroundImage) {
        backgroundCtx.globalAlpha = opacity;
        backgroundCtx.drawImage(backgroundImage, 
            labelSpace, labelSpace, 
            columns * tileSize, rows * tileSize);
        backgroundCtx.globalAlpha = 1.0;
    }
    
    // Draw tiles image if available
    if (tilesImage) {
        tilesCtx.globalAlpha = opacity;
        tilesCtx.drawImage(tilesImage, 
            labelSpace, labelSpace, 
            columns * tileSize, rows * tileSize);
        tilesCtx.globalAlpha = 1.0;
    }
    
    // Draw foreground image if available
    if (foregroundImage) {
        foregroundCtx.globalAlpha = opacity;
        foregroundCtx.drawImage(foregroundImage, 
            labelSpace, labelSpace, 
            columns * tileSize, rows * tileSize);
        foregroundCtx.globalAlpha = 1.0;
    }
}

// Get grid coordinates from mouse position
function getGridCoords(e) {
    const rect = mapCanvas.getBoundingClientRect();
    const labelSpace = 20;
    
    const x = Math.floor((e.clientX - rect.left - labelSpace) / tileSize);
    const y = Math.floor((e.clientY - rect.top - labelSpace) / tileSize);
    
    return { x, y };
}

// Update a single tile
function setTile(x, y, type) {
    if (x >= 0 && x < columns && y >= 0 && y < rows) {
        mapData[y][x] = type;
    }
}

// Draw a line using Bresenham's algorithm
function drawLine(x0, y0, x1, y1, type) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
        setTile(x0, y0, type);
        
        if (x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

function drawRect(x0, y0, x1, y1, type, fill = false) {
    // Ensure x0,y0 is top-left and x1,y1 is bottom-right
    const startX = Math.min(x0, x1);
    const startY = Math.min(y0, y1);
    const endX = Math.max(x0, x1);
    const endY = Math.max(y0, y1);
    
    if (fill) {
        // Fill rectangle
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                setTile(x, y, type);
            }
        }
    } else {
        // Just the outline
        for (let x = startX; x <= endX; x++) {
            setTile(x, startY, type); // Top
            setTile(x, endY, type);   // Bottom
        }
        for (let y = startY + 1; y < endY; y++) {
            setTile(startX, y, type); // Left
            setTile(endX, y, type);   // Right
        }
    }
}

function floodFill(startX, startY, targetType, replacementType) {
    // If target is already the replacement type, do nothing
    if (targetType === replacementType) return;
    
    const queue = [];
    queue.push({x: startX, y: startY});
    
    while (queue.length > 0) {
        const {x, y} = queue.shift();
        
        // Check if point is out of bounds
        if (x < 0 || x >= columns || y < 0 || y >= rows) continue;
        
        // Check if this is not the target type
        if (mapData[y][x] !== targetType) continue;
        
        // Replace the type
        mapData[y][x] = replacementType;
        
        // Add the 4 neighboring points to the queue
        queue.push({x: x + 1, y}); // Right
        queue.push({x: x - 1, y}); // Left
        queue.push({x, y: y + 1}); // Down
        queue.push({x, y: y - 1}); // Up
    }
}

function updatePreview(e) {
    if (!isDrawing || startX === null || startY === null) return;
    
    const { x, y } = getGridCoords(e);
    if (x < 0 || x >= columns || y < 0 || y >= rows) return;
    
    // Clear the preview
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    const type = eraseMode ? "0" : selectedTile;
    const labelSpace = 20;
    
    if (activeTool === 'line') {
        // Draw preview line
        const dx = Math.abs(x - startX);
        const dy = Math.abs(y - startY);
        const sx = (startX < x) ? 1 : -1;
        const sy = (startY < y) ? 1 : -1;
        let err = dx - dy;
        let currX = startX;
        let currY = startY;
        
        while (true) {
            const drawX = currX * tileSize + labelSpace;
            const drawY = currY * tileSize + labelSpace;
            drawTile(previewCtx, currX, currY, type, drawX, drawY);
            
            if (currX === x && currY === y) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                currX += sx;
            }
            if (e2 < dx) {
                err += dx;
                currY += sy;
            }
        }
    } else if (activeTool === 'rect' || activeTool === 'fillRect') {
        // Draw rectangle preview
        const startXDraw = Math.min(startX, x);
        const startYDraw = Math.min(startY, y);
        const endXDraw = Math.max(startX, x);
        const endYDraw = Math.max(startY, y);
        
        if (activeTool === 'fillRect') {
            // Fill rectangle
            for (let py = startYDraw; py <= endYDraw; py++) {
                for (let px = startXDraw; px <= endXDraw; px++) {
                    const drawX = px * tileSize + labelSpace;
                    const drawY = py * tileSize + labelSpace;
                    drawTile(previewCtx, px, py, type, drawX, drawY);
                }
            }
        } else {
            // Just the outline
            for (let px = startXDraw; px <= endXDraw; px++) {
                let drawX = px * tileSize + labelSpace;
                
                // Top line
                let drawY = startYDraw * tileSize + labelSpace;
                drawTile(previewCtx, px, startYDraw, type, drawX, drawY);
                
                // Bottom line
                drawY = endYDraw * tileSize + labelSpace;
                drawTile(previewCtx, px, endYDraw, type, drawX, drawY);
            }
            
            for (let py = startYDraw + 1; py < endYDraw; py++) {
                let drawY = py * tileSize + labelSpace;
                
                // Left line
                let drawX = startXDraw * tileSize + labelSpace;
                drawTile(previewCtx, startXDraw, py, type, drawX, drawY);
                
                // Right line
                drawX = endXDraw * tileSize + labelSpace;
                drawTile(previewCtx, endXDraw, py, type, drawX, drawY);
            }
        }
    }
}

// Handle mouse events - consolidated event handlers
mapCanvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    const { x, y } = getGridCoords(e);
    
    if (x < 0 || x >= columns || y < 0 || y >= rows) return;
    
    if (activeTool === 'brush') {
        // Immediate drawing for brush tool
        setTile(x, y, eraseMode ? "0" : selectedTile);
        drawGrid();
    } else if (activeTool === 'fill') {
        // Flood fill
        const targetType = mapData[y][x];
        floodFill(x, y, targetType, eraseMode ? "0" : selectedTile);
        drawGrid();
    } else {
        // Start position for line, rect tools
        startX = x;
        startY = y;
    }
});

mapCanvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    
    const { x, y } = getGridCoords(e);
    
    if (x < 0 || x >= columns || y < 0 || y >= rows) return;
    
    if (activeTool === 'brush') {
        // Brush continues to draw while dragging
        setTile(x, y, eraseMode ? "0" : selectedTile);
        drawGrid();
    } else if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'fillRect') {
        // Preview for line and rect tools
        updatePreview(e);
    }
});

mapCanvas.addEventListener("mouseup", (e) => {
    if (!isDrawing) return;
    
    const { x, y } = getGridCoords(e);
    
    if ((activeTool === 'line' || activeTool === 'rect' || activeTool === 'fillRect') && 
        startX !== null && startY !== null && 
        x >= 0 && x < columns && y >= 0 && y < rows) {
        
        if (activeTool === 'line') {
            // Complete line
            drawLine(startX, startY, x, y, eraseMode ? "0" : selectedTile);
        } else if (activeTool === 'rect' || activeTool === 'fillRect') {
            // Complete rectangle
            drawRect(startX, startY, x, y, eraseMode ? "0" : selectedTile, activeTool === 'fillRect');
        }
    }
    
    // Clear the preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Reset state
    isDrawing = false;
    startX = null;
    startY = null;
    
    drawGrid();
});

// Prevent drawing when cursor leaves the canvas
mapCanvas.addEventListener("mouseleave", () => {
    if (isDrawing && (activeTool === 'line' || activeTool === 'rect' || activeTool === 'fillRect')) {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
});

document.addEventListener("keydown", (e) => {
    if (["1", "2", "3", "4", "5"].includes(e.key)) {
        selectedTile = e.key;
        eraseMode = false;
        eraseModeText.innerText = "OFF";
        const tileNames = {
            "1": "Floor",
            "2": "Platform",
            "3": "Wall",
            "4": "Cutscene",
            "5": "Ladder"
        };
        selectedTileText.innerText = `${e.key} (${tileNames[e.key]})`;
    }
    if (e.key.toLowerCase() === "e") {
        toggleEraseMode();
    }
    // Add shortcut keys for tools
    if (e.key === "b") setActiveTool("brush");
    if (e.key === "l") setActiveTool("line");
    if (e.key === "r") setActiveTool("rect");
    if (e.key === "f") setActiveTool("fillRect");
    if (e.key === "g") setActiveTool("fill");
});

function toggleEraseMode() {
    eraseMode = !eraseMode;
    eraseModeText.innerText = eraseMode ? "ON" : "OFF";
}

document.getElementById("eraseModeBtn").addEventListener("click", toggleEraseMode);

applySizeBtn.addEventListener("click", () => {
    initializeMap();
});

// Image loading handlers
document.getElementById("backgroundImage").addEventListener("change", function(e) {
    loadImage(e, "background");
});

document.getElementById("tilesImage").addEventListener("change", function(e) {
    loadImage(e, "tiles");
});

document.getElementById("foregroundImage").addEventListener("change", function(e) {
    loadImage(e, "foreground");
});

document.getElementById("clearBackgroundBtn").addEventListener("click", function() {
    backgroundImage = null;
    drawBackgroundLayers();
});

document.getElementById("clearTilesBtn").addEventListener("click", function() {
    tilesImage = null;
    drawBackgroundLayers();
});

document.getElementById("clearForegroundBtn").addEventListener("click", function() {
    foregroundImage = null;
    drawBackgroundLayers();
});

opacitySlider.addEventListener("input", function() {
    opacityValue.textContent = this.value;
    drawBackgroundLayers();
});

function loadImage(event, layer) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            if (layer === "background") {
                backgroundImage = img;
            } else if (layer === "tiles") {
                tilesImage = img;
            } else if (layer === "foreground") {
                foregroundImage = img;
            }
            drawBackgroundLayers();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Horizontal compression (for floors, platforms, and ladders)
function compressHorizontalRanges(data, tileType) {
    let result = [];
    for (let y = 0; y < rows; y++) {
        let start = null;
        for (let x = 0; x <= columns; x++) {
            if (x < columns && data[y][x] === tileType) {
                if (start === null) start = x;
            } else if (start !== null) {
                result.push({ row: y, start, end: x - 1 });
                start = null;
            }
        }
    }
    return result;
}

// Vertical compression (for walls)
function compressVerticalRanges(data, tileType) {
    let result = [];
    for (let x = 0; x < columns; x++) {
        let start = null;
        for (let y = 0; y <= rows; y++) {
            if (y < rows && data[y][x] === tileType) {
                if (start === null) start = y;
            } else if (start !== null) {
                result.push({ column: x, startY: start, endY: y - 1 });
                start = null;
            }
        }
    }
    return result;
}

// Function to compress wall entries horizontally
function compressWallRanges(verticalRanges) {
    // First group by Y ranges that are exactly the same
    const rangeGroups = {};
    
    verticalRanges.forEach(range => {
        const key = `${range.startY}-${range.endY}`;
        if (!rangeGroups[key]) {
            rangeGroups[key] = [];
        }
        rangeGroups[key].push(range.column);
    });
    
    // Now compress consecutive columns within each group
    const result = [];
    Object.entries(rangeGroups).forEach(([key, columns]) => {
        const [startY, endY] = key.split('-').map(Number);
        
        // Sort columns numerically
        columns.sort((a, b) => a - b);
        
        let startColumn = columns[0];
        let prevColumn = columns[0];
        
        for (let i = 1; i <= columns.length; i++) {
            // If we're at the end or there's a gap in the sequence
            if (i === columns.length || columns[i] !== prevColumn + 1) {
                result.push({
                    startColumn,
                    endColumn: prevColumn,
                    startY,
                    endY
                });
                
                if (i < columns.length) {
                    startColumn = columns[i];
                }
            }
            
            if (i < columns.length) {
                prevColumn = columns[i];
            }
        }
    });
    
    return result;
}

// Function to compress ladder entries vertically
function compressVerticalLadders(horizontalRanges) {
    // Group ladder segments by their x-range (start-end)
    const rangeGroups = {};

    horizontalRanges.forEach(range => {
        const key = `${range.start}-${range.end}`;
        if (!rangeGroups[key]) {
            rangeGroups[key] = [];
        }
        rangeGroups[key].push(range.row);
    });

    // Compress consecutive rows within each group
    const result = [];
    Object.entries(rangeGroups).forEach(([key, rows]) => {
        const [start, end] = key.split('-').map(Number);

        // Sort rows numerically
        rows.sort((a, b) => a - b);

        let startRow = rows[0];
        let prevRow = rows[0];

        for (let i = 1; i <= rows.length; i++) {
            // If we're at the end or there's a gap in the sequence
            if (i === rows.length || rows[i] !== prevRow + 1) {
                result.push({
                    startRow,
                    endRow: prevRow,
                    start,
                    end
                });
                
                if (i < rows.length) {
                    startRow = rows[i];
                }
            }
            
            if (i < rows.length) {
                prevRow = rows[i];
            }
        }
    });

    return result;
}

function exportMap() {
    // First compress walls vertically
    const verticalWallRanges = compressVerticalRanges(mapData, "3");
    
    // Then compress the vertical ranges horizontally
    const compressedWalls = compressWallRanges(verticalWallRanges);
    
    // Horizontal ladder ranges
    const horizontalLadderRanges = compressHorizontalRanges(mapData, "5");
    
    // Compress ladders vertically
    const compressedLadders = compressVerticalLadders(horizontalLadderRanges);
    
    const jsonOutput = JSON.stringify({
        mapName: "NewMap",
        version: 1.1,
        gravity: 1.2,
        rows,
        columns,
        floorRows: compressHorizontalRanges(mapData, "1"),
        platformPositions: compressHorizontalRanges(mapData, "2"),
        wallRows: compressedWalls,
        cutscenePositions: compressHorizontalRanges(mapData, "4"),
        ladderPositions: compressedLadders,
        // Don't include image data in the JSON as it would make it too large
        hasBackgroundImage: backgroundImage !== null,
        hasTilesImage: tilesImage !== null,
        hasForegroundImage: foregroundImage !== null
    }, null, 2);

    const blob = new Blob([jsonOutput], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "map.json";
    a.click();
    
    // If there are images, offer to save them separately
    if (backgroundImage || tilesImage || foregroundImage) {
        const saveImages = confirm("Would you like to save the background images as well?");
        if (saveImages) {
            if (backgroundImage) {
                const a = document.createElement("a");
                a.href = backgroundCanvas.toDataURL();
                a.download = "background.png";
                a.click();
            }
            if (tilesImage) {
                const a = document.createElement("a");
                a.href = tilesCanvas.toDataURL();
                a.download = "tileground.png";
                a.click();
            }
            if (foregroundImage) {
                const a = document.createElement("a");
                a.href = foregroundCanvas.toDataURL();
                a.download = "foreground.png";
                a.click();
            }
        }
    }
}

document.getElementById("exportBtn").addEventListener("click", exportMap);


function compressVerticalLadders(horizontalRanges) {
// Group ladder segments by their x-range (start-end)
const rangeGroups = {};

horizontalRanges.forEach(range => {
const key = `${range.start}-${range.end}`;
if (!rangeGroups[key]) {
    rangeGroups[key] = [];
}
rangeGroups[key].push(range.row);
});

// Compress consecutive rows within each group
const result = [];
Object.entries(rangeGroups).forEach(([key, rows]) => {
const [start, end] = key.split('-').map(Number);

// Sort rows numerically
rows.sort((a, b) => a - b);

let startRow = rows[0];
let prevRow = rows[0];

for (let i = 1; i <= rows.length; i++) {
    // If we're at the end or there's a gap in the sequence
    if (i === rows.length || rows[i] !== prevRow + 1) {
        result.push({
            startRow,
            endRow: prevRow,
            start,
            end
        });
        
        if (i < rows.length) {
            startRow = rows[i];
        }
    }
    
    if (i < rows.length) {
        prevRow = rows[i];
    }
}
});

return result;
}

document.getElementById("importFile").addEventListener("change", importMap);
document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
});

// Initialize the map
initializeMap();