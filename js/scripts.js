// Холст
    const canvas = document.getElementById('tetrisCanvas');
    const ctx = canvas.getContext('2d');
    //Цвет заливки холста
    const backgroundColor = '#4a4f5c';
    // Отрисовка игрового поля
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Размер поля ширина
    const width = canvas.width;
    //Размер поля высота
    const height = canvas.height;
    //Начальная позиция X
    let squareX = 180;
    //Начальная позиция Y
    const squareY = 0;
    //Размер одной точки (квадрата)
    const squareSize = 30;
    // Ширина границы точки
    const borderWidth = 2;
    // Цвет границы точки
    const borderColor = "blue";
    // Цвета точек, важно иметь картинки на каждый цвет в img/
    const predefinedColors = ["red", "green", "yellow", "cyan","purple"];
    // Модификатор скорости
    const speedModifier = 30;

    /* внутриигровые переменные */
    //Начальная скорость
    let speed = 1000;
    // Двигающаяся фигура
    let activeShape = null;
    // Массив с загруженными картинкими (цветами)
    const images = new Map();
    // Класс создания точки (квадрата)
    class Point {
        x
        y
        color
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
        }
        print() {
            // Код отрисовки без картинки
            // ctx.fillStyle = this.color;
            // ctx.fillRect(this.x, this.y, squareSize, squareSize);
            // ctx.strokeStyle = borderColor;
            // ctx.lineWidth = borderWidth;
            // ctx.strokeRect(this.x, this.y, squareSize, squareSize);
            ctx.drawImage(images.get(this.color), this.x, this.y, squareSize, squareSize);
        }
        erase(){
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(this.x, this.y, squareSize, squareSize);
            // Код стирания границы
            // ctx.strokeStyle = backgroundColor;
            // ctx.lineWidth = borderWidth;
            // ctx.strokeRect(this.x, this.y, squareSize, squareSize);
        }
    }

    //Хранение всех фигур
    class PointArray {
        constructor() {
            this.points = []; // Массив для хранения фигур
        }
        // Метод для добавления фигуры в массив
        addPoint(point) {
            this.points.push(point);
        }

        addAllPoints(points) {
            points.forEach(p => this.addPoint(p));
        }
        contains(point) {
            return this.points.some(p => p.x === point.x && p.y === point.y);
        }
        containsOne(points){
            for (const point of points) {
                if (this.contains(point)) {
                    return true;
                }
            }
            return false;
        }
        crossCollision(points) {
            return this.containsOne(points);
        }
        // Возвращает заполненные строки
        getRowsToDelete(){
            let rowsToDelete = [];
            let max = width / squareSize;
            for(let y = 0; y < height; y += squareSize){
                let points = 0;
                for(let x = 0; x < width; x += squareSize){
                    if( this.points.some(p => p.x === x && p.y === y)){
                        if(++points === max) rowsToDelete.push(y);
                    }
                }
            }
            return rowsToDelete;
        }
        // Удаляем строки
        deleteRows(rowsToDelete){
            rowsToDelete.forEach(y => this.deleteRow(y));
        }
        // Удалить  строку
        deleteRow(y) {
            let newPoints = [];
            this.points.forEach(point => {
                let newY = 0;
                if(point.y < y) newY = point.y + squareSize;
                else if(point.y > y) newY = point.y;
                if(newY !== 0)
                    newPoints.push(new Point(point.x, newY, point.color));
            });
            this.points.forEach(p => {
                if(p.y === y || p.y < y) p.erase();
            })
            this.points = newPoints;
            this.points.forEach(p => {
                if(p.y === y || p.y < y) p.print();
            });
        }
    }
    // Хранение всех точек фигур которые остановились
    const stoppedPoints = new PointArray();

    // Класс фигуры
    class Shape {
        points
        constructor(squares) {
            this.points = squares;
        }
        // Отрисовка точек
        print() {
            this.points.forEach(s => s.print());
        }
        // Стирание точек
        erase(){
            this.points.forEach(s => s.erase());
        }
        // Удаляет старые точки и рисует новую фигуру по заданным точкам
        moveTo(newPoints){
            this.erase();
            this.points = newPoints;
            this.print();
        }
        // Двигает влево на значение шага @squareSize
        moveLeft() {
            const newPoints = this.points.map(point => {
                return new Point(point.x - squareSize, point.y, point.color);
            });
            const canMove = newPoints.every(point => point.x >= 0 && !stoppedPoints.contains(point));
            if (canMove) {
                this.moveTo(newPoints);
            }
        }
        // Двигает вправо на значение шага @squareSize
        moveRight() {
            const newPoints = this.points.map(point => {
                return new Point(point.x + squareSize, point.y, point.color);
            });
            const canMove = newPoints.every(point => point.x < width && !stoppedPoints.contains(point));
            if (canMove) {
                this.moveTo(newPoints);
            }
        }
        // Двигает вниз на значение шага @squareSize
        moveDown() {
            const canMoveDown = this.points.every(s => s.y + squareSize < height);
            const newPoints = this.points.map(point => {
                return new Point(point.x, point.y + squareSize, point.color);
            });
            if (canMoveDown && !stoppedPoints.crossCollision(newPoints)) {
                this.erase();
                this.points.forEach(s => s.y += squareSize);
                this.print();
                return true;
            } else {
                return false;
            }
        }
        // Сохраняет точки в массив остановившихся
        savePoints() {
            stoppedPoints.addAllPoints(this.points);
        }
        //Поворот фигуры на 90
        rotate() {
            // Поворот фигуры LShape на 90 градусов
            const rotatedSquares = this.points.map(s => {
                let p = this.getCenterPoint();
                const newX = p.x + p.y - s.y;
                const newY = p.y - p.x + s.x;
                return new Point(newX, newY, this.points[0].color);
            });
            // Проверка, чтобы фигура не выходила за границы
            const isValidRotation = rotatedSquares.every(s => {
                return s.x >= 0 && s.x < width && s.y >= 0 && s.y < height;
            });
            if (isValidRotation && !stoppedPoints.crossCollision(rotatedSquares)) {
                this.erase();
                this.points = rotatedSquares;
                this.print();
            }
        }
        getLeftPoint() {
            let p = this.points[0];
            this.points.forEach(s => {
                if (s.x < p.x || s.y < p.y) {
                    p = s;
                }
            });
            return p;
        }
        //Получение центра фигуры
        getCenterPoint() {
            let totalX = 0;
            let totalY = 0;

            this.points.forEach(s => {
                totalX += s.x;
                totalY += s.y;
            });

            const centerX = totalX / this.points.length;
            const centerY = totalY / this.points.length;

            // Найдем ближайшую точку к центру
            let closestDistance = Infinity;
            let closestPoint = null;
            this.points.forEach(s => {
                const distance = Math.sqrt((s.x - centerX) ** 2 + (s.y - centerY) ** 2);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPoint = s;
                }
            });

            return closestPoint;
        }
        // Выбырает случайный цвет из списка @predefinedColors
        static getRandomColor() {
            return predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
        }
    }
    // L фигура
    class LShape extends Shape {
        static create() {
            let color = Shape.getRandomColor();
            let squares = [
                new Point(squareX, squareY, color),
                new Point(squareX, squareY + squareSize, color),
                new Point(squareX, squareY + 2 * squareSize, color),
                new Point(squareX + squareSize, squareY + 2 * squareSize, color),
            ]
            return new LShape(squares);
        }
    }
    // J фигура
    class JShape extends Shape {
        static create() {
            let color = Shape.getRandomColor();
            let squares = [
                new Point(squareX, squareY, color),
                new Point(squareX, squareY + squareSize, color),
                new Point(squareX, squareY + 2 * squareSize, color),
                new Point(squareX - squareSize, squareY + 2 * squareSize, color),
            ]
            return new JShape(squares);
        }
    }
    // I фигура
    class IShape extends Shape {
        static create() {
            let color = Shape.getRandomColor();
            let squares = [
                new Point(squareX, squareY, color),
                new Point(squareX, squareY + squareSize, color),
                new Point(squareX, squareY + 2 * squareSize, color),
                new Point(squareX, squareY + 3 * squareSize, color),
            ]
            return new IShape(squares);
        }
    }
    // T фигура
    class TShape extends Shape {
        static create() {
            let color = Shape.getRandomColor();
            let squares = [
                new Point(squareX, squareY, color),
                new Point(squareX - squareSize, squareY, color),
                new Point(squareX + squareSize, squareY, color),
                new Point(squareX, squareY + squareSize, color),
            ]
            return new TShape(squares);
        }
    }
    // Z фигура
    class ZShape extends Shape {
        static create() {
            let color = Shape.getRandomColor();
            let squares = [
                new Point(squareX, squareY, color),
                new Point(squareX + squareSize, squareY, color),
                new Point(squareX + squareSize, squareY + squareSize, color),
                new Point(squareX + 2 * squareSize, squareY + squareSize, color),
            ]
            return new ZShape(squares);
        }
    }
    // S фигура
    class SShape extends Shape {
        static create() {
            let color = Shape.getRandomColor();
            let squares = [
                new Point(squareX, squareY, color),
                new Point(squareX, squareY + squareSize, color),
                new Point(squareX + squareSize, squareY, color),
                new Point(squareX - squareSize, squareY + squareSize, color),
            ]
            return new SShape(squares);
        }
    }
    // O фигура
    class OShape extends Shape {
        static create() {
            let color = Shape.getRandomColor();
            let squares = [
                new Point(squareX, squareY, color),
                new Point(squareX, squareY + squareSize, color),
                new Point(squareX + squareSize, squareY, color),
                new Point(squareX + squareSize, squareY + squareSize, color),
            ]
            return new OShape(squares);
        }
        rotate() {
        }
    }

    //Создание случайной фигуры
    function createNewShape() {
        const randomNum = Math.floor(Math.random() * 7);
        switch (randomNum) {
            case 0:
                activeShape = LShape.create();
                break;
            case 1:
                activeShape = OShape.create();
                break;
            case 2:
                activeShape = IShape.create();
                break;
            case 3:
                activeShape = JShape.create();
                break;
            case 4:
                activeShape = TShape.create();
                break;
            case 5:
                activeShape = ZShape.create();
                break;
            case 6:
                activeShape = SShape.create();
                break;
            default:
                activeShape = OShape.create();
        }
        activeShape.print();
        //Возврат true если новая пересекается с уже существующими
        return !stoppedPoints.crossCollision(activeShape.points);
    }
    // Счетчик очков
    let score = 0;
    // Увеличение скорости падения фигур по мере игры
    function increaseSpeed(m = 1) {
        if(speed > 700)
         speed = speed - speedModifier/2 * m;
        else if (speed > 500)
            speed = speed - speedModifier/5 * m;
        else if (speed > 250)
            speed = speed - speedModifier/10 * m;
        else if (speed > 100)
            speed = speed - speedModifier/30 * m;
        document.getElementById('speed').innerText = speed;
    }
    function gameOver() {
        window.alert("Игра окончена, ваш счёт: " + score);
        location.reload();
    }
    // Переменная для отмены таймаута на движение
    let run;
    //Шаг вниз @resetTimeout для сброса времени шага при ручном передвижении
    function step(resetTimeout = false){
        if (!activeShape.moveDown()) {
            activeShape.savePoints();

            let rowsToDelete = stoppedPoints.getRowsToDelete();
            if(rowsToDelete.length > 0){
                stoppedPoints.deleteRows(rowsToDelete);
                score += rowsToDelete.length;
                document.getElementById('score').innerText = score;
                increaseSpeed(5);
            }else
                increaseSpeed();
            if(!createNewShape()){
                gameOver();
                clearTimeout(run);
            }
        }
        if(!resetTimeout) {
            run = setTimeout(step, speed);
        }else{
            clearTimeout(run);
            run = setTimeout(step, speed);
        }
    }
    // Обработчик событий клавиатуры
    document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                activeShape.moveLeft();
            } else if (event.key === 'ArrowRight') {
                activeShape.moveRight();
            } else if (event.key === 'ArrowDown') {
                step(true);
            } else if (event.key === 'ArrowUp') {
                activeShape.rotate();
            }
        });
    // Загрузка изображений, когда загружены все, то старт игры
    function loadGame() {
        predefinedColors.forEach(color => {
            const img = new Image();
            img.src = "img/" + color + ".png";
            images.set(color,img);
            img.onload = startGame;
        })
    }
    // Запуск игры
    let loadedImages = 0;
    function startGame() {
        loadedImages++;
        if(loadedImages === predefinedColors.length){
            document.getElementById('speed').innerText = speed;
            createNewShape();
            run = setTimeout(step, speed);
        }
    }
    // Вызываем функцию начала игры
    loadGame();
    // startGame();