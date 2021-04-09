function checkKeys(but){ // Общий контроль кнопок
    console.log(but.key)
    if (but.key == " "){ // Если это пробел
        console.log('pass');
        go.pass(); // Пропускаем ход
    }
    else if (but.key == "F9"){ // Если это F9
        game.showGroupId = ++game.showGroupId % 2; // Рисуем номера групп
        game.draw();
    }
    else if (but.key == "z" && but.ctrlKey){ // Если это ctrl + z
        go.rollback(1); // Отменяем ход
        game.draw();
    }
}

document.addEventListener("keydown", checkKeys);


class Game{
    constructor(go){
        this.go = go;
        this.showGroupId = 0;
        this.adjustSize();

        cvs.addEventListener("click", (e) => this.checkClick(e));

        this.draw();
    }

    adjustSize(){
        let height = document.documentElement.clientHeight;
        let width  = document.documentElement.clientWidth;

        console.log(height, width);

        [height, width] = [height - 24, width - 20];

        this.pieceSize = Math.min(height / this.go.size.height, width / this.go.size.width);



        cvs.height = this.pieceSize * this.go.size.height;
        cvs.width  = this.pieceSize * this.go.size.width;
    }

    draw(){ // Отрисовываем всё
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        // Рисуем сетку

        ctx.beginPath();
        for (let i = 0; i < go.size.width; i++){

            let x = this.pieceSize * i + this.pieceSize / 2;
            ctx.moveTo(x, this.pieceSize/2);
            ctx.lineTo(x, cvs.height - this.pieceSize/2);
        }
        for (let i = 0; i < go.size.height; i++){
            let y = this.pieceSize * i + this.pieceSize / 2;
            ctx.moveTo(this.pieceSize/2, y);
            ctx.lineTo(cvs.width - this.pieceSize/2, y);
        }
        ctx.strokeStyle = '#aaa';
        ctx.stroke();

        // Рисуем камни

        this.go.field.forEach((line, y) => {
            line.forEach((stone, x) => {
                if(stone.is){
                    this.drawCircle(stone.color, x, y);
                }
            });
        });
    }

    checkClick(clk){ // Проверяем клик мыши
    
        //Вычисляем клетку по Y
        let fieldY = Math.floor(clk.offsetY / this.pieceSize);
        let fieldX = Math.floor(clk.offsetX / this.pieceSize);
        console.log(fieldY, fieldX);

        this.go.move(fieldX, fieldY);
        this.draw();
    }

    drawCircle(col, x, y){ // Рисуем круг
        let group = this.go.field[y][x].group;


        let color;
        if (col){color = '#ccc';} else {color = '#222'; }
        x = (x+1) * this.pieceSize - (this.pieceSize/2);
        y = (y+1) * this.pieceSize - (this.pieceSize/2);
        let size = this.pieceSize / 2 * 0.8;
    
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#eee';
        ctx.stroke();

        if (this.showGroupId){ // Рисуем номер группы
            ctx.fillStyle = "#00F";
            ctx.strokeStyle = "#F00";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `bold ${size}px sans-serif`;
            ctx.strokeText(group, x, y);
        }
        
    }
}

class Go{
    constructor(height, width){
        this.size = {height: height, width: width};
        if(!width) this.size.width = this.size.height;
        if(Math.max(this.size.width, this.size.height) > 250) except();
        
        this.reset();
    }

    getPosition(x, y){ // Элемент на конкретной позиции
        // let [x, y] = this.coordsFromStr(purp);
        let stone = this.field[y][x];
        return this.characterFromColor(stone.color);
    }

    move(x, y){ // Куда положить камень
        if (!this.field[y][x].is){ // Если камня на этом месте нет
            this.addStone(this.userColor, x, y); // Добавляем туда камень
            this.checkPlace(); // Проверяем его позицию
            this.pass();
        }else{
            except();
        }
    
    }

    pass(){
        this.saveHistory(); // Записываем ход в историю
        this.userColor = (this.userColor + 1) % 2; // Меняем цвет
    }

    addStone(col, x, y){ // Добавляем камушек
        function checkSide(stone){
            if(stone.is){ // Если камень есть
                if(stone.color == newStone.color){ // Если одинаковый цвет камней
                    if(newStone.group !== undefined && newStone.group != stone.group){ //Если id групп - разный
                        this.changeGroup(stone.group, newStone.group); // Соединяем группы в один id
                    }
                    else{ // Если id у нового камня нет
                        newStone.group = stone.group; // Присваиваем ему id этой группы
                    }
                    return 1;
                }else{ // Если цвет разный
                    return 0;
                }
            }
            return 1;
        }


        let newStone = {is: true, color: col};

        if (y > 0)                  checkSide.call(this, this.field[y-1][x]); // проверка сверху
        if (y < this.size.height-1) checkSide.call(this, this.field[y+1][x]); // Проверка снизу
        if (x > 0)                  checkSide.call(this, this.field[y][x-1]); // Проверка слева
        if (x < this.size.width-1)  checkSide.call(this, this.field[y][x+1]); // Проверка справа

        if (newStone.group === undefined) { // Если группа так и не присвоилась
            newStone.group = this.groupId++; // Увеличиваем счётчик
            this.groupColors[newStone.group] = newStone.color; // И ставим номер группы
        }

        this.field[y][x] = newStone; // Добавляем камень на поле
    }

    changeGroup(old, nw){ // Меняем номер группы
        for (let line of this.field){
            for(let stone of line){
                if(stone.group == old) stone.group = nw;
            }
        }
        delete this.groupColors[old];
    }

    deleteGroup(num){ // Удаляем всю группу с данным номером
        for(let y = 0; y < this.size.height; y++){
            for (let x = 0; x < this.size.width; x++) {
                if(this.field[y][x].group == num) {
                    this.field[y][x] = {};
                }
            }
        }
    }

    checkPlace(){ // Проверяем есть место у группы
        let place = (stone) => { if(stone.is) return 0; return 1; }; // Проверяет есть ли место


        let checking; // Проверяющийся камень
        let places = {}; // Места для групп
        let side = []; 

        for(let y = 0; y < this.size.height; y++){
            for (let x = 0; x < this.size.width; x++) {
                checking = this.field[y][x];
                if (!checking.is || places[checking.group]) continue; // Если камня нет или его группа уже проверена

                side = []; // Проверка камня с каждой стороны
                if (y > 0)                  side.push( place(this.field[y-1][x]) );
                if (y < this.size.height-1) side.push( place(this.field[y+1][x]) );
                if (x > 0)                  side.push( place(this.field[y][x-1]) );
                if (x < this.size.width-1)  side.push( place(this.field[y][x+1]) );
                places[checking.group] = Math.max(...side); // Записываем есть ли свободное место у группы
            }
        }
        let candidateDeletion = [];
        let colorDeletion = [];
        for(let group in places){ // Отсеиваем кандидатов на удаление
            if(!places[group]){
                candidateDeletion.push(group);
                colorDeletion.push(this.groupColors[group]);
            }
        }

        if(candidateDeletion.length){ // Если есть кандидаты на удаление
            while(true){
                let myColor = colorDeletion.indexOf(this.userColor); // Пытаемся найти текущий цвет
                if (myColor == -1) break; // Если текущих цветов больше нет, закругляемся
                colorDeletion.splice(myColor, 1); // Удаляем текущий цвет из списков
                candidateDeletion.splice(myColor, 1);
            }
            if(!candidateDeletion.length){ // Если список опустошился
                this.loadHistory(-1); // Значит ход убил только текущий цвет
                except(); // Отменяемся
            }

            for (let group of candidateDeletion) { // Удаляем остальные группы
                this.deleteGroup(group);
            }
        }
        if(this.comparePositions()){ // Если позиция повторилась
            this.loadHistory(-1);
            except();
        }
    }

    handicapStones(count){
        if (this.history.length > 1 || !this.emptyField()) except();
        let handicaps = {
            9:  [[6, 2],  [2, 6],  [6, 6],   [2, 2], [4, 4]],
            13: [[9, 3],  [3, 9],  [9, 9],   [3, 3], [6, 6], [3, 6], [9, 6],  [6, 3], [6, 9]],
            19: [[15, 3], [3, 15], [15, 15], [3, 3], [9, 9], [3, 9], [15, 9], [9, 3], [9, 15]]
        };

        for(let i = 0; i < count; i++){
            let [x, y] = handicaps[this.size.width][i];
            this.addStone(0, x, y);
        }
    }

    comparePositions(){
        if(this.history.length < 2) return false;
        let old = this.history[this.history.length-2];
        for (let y = 0; y < this.size.height; y++) {
            for (let x = 0; x < this.size.width; x++) {
                if(old[y][x].color != this.field[y][x].color) return false;
            }
        }
        return true;
    }

    saveHistory(){
        let clone = this.field.map(line => {
            return line.map(stone => {
                let newStone = {};
                return Object.assign(newStone, stone);
            });
        });

        this.history.push(clone);
    }

    loadHistory(index){
        if(index < 0) index = this.history.length + index;

        let clone = this.history[index].map(line => {
            return line.map(stone => {
                let newStone = {};
                return Object.assign(newStone, stone);
            });
        });

        this.field = clone;
    }

    coordsFromStr(str){ // Координаты из строки
        let books = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';

        let x = str[str.length-1];
        let y = str.slice(0, -1);
        

        x = books.indexOf(x);
        y = this.size.height - y;
        return [x, y];
    }

    characterFromColor(color){ // Символ из цвета
        switch(color){
            case 0:  return 'x';
            case 1:  return 'o';
            default: return '.';
        }
    }

    rollback(count){ // Откат назад
        if(count >= this.history.length) except();
        this.history.splice(-count);
        this.loadHistory(-1);
        this.userColor = (this.userColor + count) % 2;
    }

    reset(){ // Сброс поля и значений
        this.groupColors = []; // Цвета групп
        this.history = []; // История ходов
        this.groupId = 0; // id для новых групп
        this.field = []; // Внутреннее поле
        for(let i = 0; i < this.size.height; i++){
            let line = [];
            for(let l = 0; l < this.size.width; l++){line.push({});}
            this.field.push(line);
        }
        this.userColor = 0; // 1 - Белый, 0 - Чёрный

        this.saveHistory();
    }

    emptyField(){ // Проверяет является ли доска пустой
        for(let line of this.field){
            for(let stone of line) {
                for(let _ in stone) return false;
            }
        }
        return true;
    }

    get board(){ // Поле в виде кружков и крестиков
        return this.field.map(line => {
            return line.map(stone => {
                return this.characterFromColor(stone.color);
            });
        });
    }

    get turn() { return ['black', 'white'][this.userColor]; }
        
}
let except = () => {throw "IllegalArgumentException";};
let getMaxOfArray = (numArray) => Math.max.apply(null, numArray);


let squareSize = 9;

let go = new Go(squareSize);

let cvs = document.querySelector("#canvas");
let ctx = cvs.getContext("2d");

let game = new Game(go);

//-------------------

let passBut = document.querySelector("#pass");

passBut.addEventListener("click", () => go.pass());