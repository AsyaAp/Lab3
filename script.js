class Cell {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.moisture = 0;
        this.plant = null;
    }
    
    updateMoisture(waterCells) {
        if (this.type === 'water') {
            this.moisture = 1;
            return;
        }
        
        let maxMoisture = 0;
        
        for (const waterCell of waterCells) {
            const distance = Math.sqrt(
                Math.pow(this.x - waterCell.x, 2) + 
                Math.pow(this.y - waterCell.y, 2)
            );
            
            const moistureFromThisWater = Math.max(0, 1 - (distance / 5));
            maxMoisture = Math.max(maxMoisture, moistureFromThisWater);
        }
        
        this.moisture = maxMoisture;
    }
    
    getColor() {
        if (this.type === 'water') {
            return '#1e90ff';
        }
        
        const dryColor = { r: 245, g: 222, b: 179 };
        const wetColor = { r: 60, g: 30, b: 10 };
        
        const r = Math.round(dryColor.r + (wetColor.r - dryColor.r) * this.moisture);
        const g = Math.round(dryColor.g + (wetColor.g - dryColor.g) * this.moisture);
        const b = Math.round(dryColor.b + (wetColor.b - dryColor.b) * this.moisture);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}

class LandCell extends Cell {
    constructor(x, y) {
        super('land', x, y);
    }
}

class WaterCell extends Cell {
    constructor(x, y) {
        super('water', x, y);
        this.moisture = 1;
    }
}

class Plant {
    constructor(name, minMoisture, maxMoisture, emoji) {
        this.name = name;
        this.minMoisture = minMoisture;
        this.maxMoisture = maxMoisture;
        this.growthStage = 0;
        this.isAlive = true;
        this.emoji = emoji;
    }
    
    updateGrowth(cellMoisture) {
        if (!this.isAlive) {
            return;
        }
        
        if (cellMoisture >= this.minMoisture && cellMoisture <= this.maxMoisture) {
            this.growthStage = Math.min(1, this.growthStage + 0.05);
        } else {
            this.isAlive = false;
        }
    }
    
    getCssClass() {
        return this.name.toLowerCase().replace(' ', '-');
    }
    
    getSizeClass() {
        if (this.growthStage < 0.33) {
            return 'small';
        }
        if (this.growthStage < 0.66) {
            return 'medium';
        }
        return 'large';
    }
}

class MarshPlant extends Plant {
    constructor() {
        super('Болотник', 0.7, 1.0, '🌿');
    }
}

class Potato extends Plant {
    constructor() {
        super('Картошка', 0.3, 0.8, '🥔');
    }
}

class Cactus extends Plant {
    constructor() {
        super('Кактус', 0.0, 0.4, '🌵');
    }
}

class FarmSimulator {
    constructor(gridSize = 10) {
        this.gridSize = gridSize;
        this.cells = [];
        this.selectedTool = 'cursor';
        this.waterCells = [];
        this.initGrid();
        this.setupEventListeners();
        this.updateMoistureLevels();
        this.startGrowthCycle();
    }
    
    initGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y += 1) {
            for (let x = 0; x < this.gridSize; x += 1) {
                const cellType = Math.random() < 0.9 ? 'land' : 'water';
                let cell;
                
                if (cellType === 'land') {
                    cell = new LandCell(x, y);
                } else {
                    cell = new WaterCell(x, y);
                    this.waterCells.push(cell);
                }
                
                this.cells.push(cell);
                
                const cellElement = document.createElement('div');
                cellElement.className = `cell ${cellType}`;
                cellElement.dataset.x = x;
                cellElement.dataset.y = y;
                cellElement.style.backgroundColor = cell.getColor();
                
                cellElement.addEventListener('click', () => this.handleCellClick(cell));
                
                gridElement.appendChild(cellElement);
            }
        }
    }
    
    setupEventListeners() {
        const tools = [
            'cursor',
            'shovel',
            'marsh-seeds',
            'potato-seeds', 
            'cactus-seeds',
            'bucket'
        ];
        
        tools.forEach(tool => {
            document.getElementById(tool).addEventListener('click', () => {
                this.selectTool(tool);
            });
        });
    }
    
    selectTool(tool) {
        this.selectedTool = tool;
        
        document.querySelectorAll('.tool').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(tool).classList.add('active');
    }
    
    handleCellClick(cell) {
        const cellElement = this.getCellElement(cell.x, cell.y);
        
        switch (this.selectedTool) {
            case 'cursor':
                break;
            case 'shovel':
                this.useShovel(cell, cellElement);
                break;
            case 'marsh-seeds':
                this.plantSeed(cell, cellElement, new MarshPlant());
                break;
            case 'potato-seeds':
                this.plantSeed(cell, cellElement, new Potato());
                break;
            case 'cactus-seeds':
                this.plantSeed(cell, cellElement, new Cactus());
                break;
            case 'bucket':
                this.useBucket(cell, cellElement);
                break;
            default:
                break;
        }
        
        this.updateCellInfo(cell);
    }
    
    useShovel(cell, cellElement) {
        if (cell.type === 'water') {
            return;
        }
        
        if (cell.plant) {
            cell.plant = null;
            this.removePlantFromCell(cellElement);
        } else {
            cell.moisture = Math.max(0, cell.moisture - 0.1);
            cellElement.style.backgroundColor = cell.getColor();
        }
    }
    
    plantSeed(cell, cellElement, plant) {
        if (cell.type !== 'land' || cell.plant) {
            return;
        }
        
        cell.plant = plant;
        this.addPlantToCell(cellElement, plant);
    }
    
    useBucket(cell, cellElement) {
        if (cell.type === 'land') {
            const index = this.cells.indexOf(cell);
            this.cells[index] = new WaterCell(cell.x, cell.y);
            this.waterCells.push(this.cells[index]);
            
            cellElement.className = 'cell water';
            cellElement.style.backgroundColor = this.cells[index].getColor();
            this.removePlantFromCell(cellElement);
        } else {
            const index = this.cells.indexOf(cell);
            this.cells[index] = new LandCell(cell.x, cell.y);
            
            const waterIndex = this.waterCells.findIndex(
                wc => wc.x === cell.x && wc.y === cell.y
            );
            
            if (waterIndex !== -1) {
                this.waterCells.splice(waterIndex, 1);
            }
            
            cellElement.className = 'cell land';
            cellElement.style.backgroundColor = this.cells[index].getColor();
        }
        
        this.updateMoistureLevels();
    }
    
    addPlantToCell(cellElement, plant) {
        const plantElement = document.createElement('div');
        plantElement.className = `plant ${plant.getSizeClass()}`;
        plantElement.textContent = plant.emoji;
        plantElement.title = `${plant.name} (рост: ${Math.round(plant.growthStage * 100)}%)`;
        cellElement.appendChild(plantElement);
    }
    
    removePlantFromCell(cellElement) {
        const plantElement = cellElement.querySelector('.plant');
        if (plantElement) {
            cellElement.removeChild(plantElement);
        }
    }
    
    getCellElement(x, y) {
        return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    }
    
    updateMoistureLevels() {
        for (const cell of this.cells) {
            if (cell.type === 'land') {
                cell.updateMoisture(this.waterCells);
                const cellElement = this.getCellElement(cell.x, cell.y);
                if (cellElement) {
                    cellElement.style.backgroundColor = cell.getColor();
                }
            }
        }
    }
    
    updateCellInfo(cell) {
        const infoElement = document.getElementById('cell-info');
        let info = `Тип: ${cell.type === 'land' ? 'Земля' : 'Вода'}<br>`;
        info += `Влажность: ${Math.round(cell.moisture * 100)}%<br>`;
        
        if (cell.plant) {
            info += `Растение: ${cell.plant.name}<br>`;
            info += `Стадия роста: ${Math.round(cell.plant.growthStage * 100)}%<br>`;
            info += `Состояние: ${cell.plant.isAlive ? 'Живое' : 'Погибшее'}`;
        }
        
        infoElement.innerHTML = info;
    }
    
    startGrowthCycle() {
        setInterval(() => {
            for (const cell of this.cells) {
                if (cell.plant && cell.plant.isAlive) {
                    cell.plant.updateGrowth(cell.moisture);
                    
                    const cellElement = this.getCellElement(cell.x, cell.y);
                    if (cellElement) {
                        const plantElement = cellElement.querySelector('.plant');
                        if (plantElement) {
                            plantElement.title = `${cell.plant.name} (рост: ${Math.round(cell.plant.growthStage * 100)}%)`;
                            plantElement.className = `plant ${cell.plant.getSizeClass()}`;
                            
                            if (!cell.plant.isAlive) {
                                this.removePlantFromCell(cellElement);
                            }
                        }
                    }
                }
            }
            
            this.updateMoistureLevels();
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FarmSimulator();
});