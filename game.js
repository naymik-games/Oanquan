var game;
loadFont("PixelFont", "assets/fonts/mago1.ttf");
loadFont("PixelFontWide", "assets/fonts/mago3.ttf");
function loadFont(name, url) {
     var newFont = new FontFace(name, `url(${url})`);
     newFont.load().then(function (loaded) {
          document.fonts.add(loaded);
     }).catch(function (error) {
          return error;
     });
}
let gameData
defaultValues = { highScore: 0 }
var gameOptions = {
     gameWidth: 800,
     gameHeight: 1400,
     tileSize: 120,
     fieldSize: {
          rows: 6,
          cols: 6
     },
     fallSpeed: 250,
     diagonal: false,
     colors: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]
}

window.onload = function () {
     let gameConfig = {
          type: Phaser.AUTO,
          scale: {
               mode: Phaser.Scale.FIT,
               autoCenter: Phaser.Scale.CENTER_BOTH,
               parent: "thegame",
               width: 900,
               height: 1640
          },

          scene: [playGame]
     }
     game = new Phaser.Game(gameConfig);
     window.focus();
}
class playGame extends Phaser.Scene {
     constructor() {
          super("playGame");
     }
     preload() {


          this.load.spritesheet("tiles", "assets/sprites/tiles.png", {
               frameWidth: gameOptions.tileSize,
               frameHeight: gameOptions.tileSize
          });
     }
     create() {
          gameData = JSON.parse(localStorage.getItem('Osave'));
          if (gameData === null || gameData.length <= 0) {
               localStorage.setItem('Osave', JSON.stringify(defaultValues));
               gameData = defaultValues;
          }


          this.createLevel();
          this.score = 0
          //  this.scoreText = this.add.text(100, 50, '0')
          this.scoreText = this.add.text(game.config.width / 2, 75, '0', { fontFamily: 'PixelFont', fontSize: '170px', color: '#fafafa', align: 'center' }).setOrigin(.5).setAlpha(1)
          this.highText = this.add.text(game.config.width / 2, 175, gameData.highScore, { fontFamily: 'PixelFont', fontSize: '100px', color: '#ff0000', align: 'center' }).setOrigin(.5).setAlpha(1)

          this.statusText = this.add.text(game.config.width / 2, game.config.height - 575, '', { fontFamily: 'PixelFont', fontSize: '140px', color: '#ff0000', align: 'center' }).setOrigin(.5).setAlpha(1)


          this.resetText = this.add.text(game.config.width / 2, game.config.height - 195, 'RESET', { fontFamily: 'PixelFont', fontSize: '100px', color: '#fafafa', align: 'center' }).setOrigin(.5).setAlpha(1).setInteractive()
          this.resetText.on('pointerdown', this.reset, this)
          this.titleText = this.add.text(game.config.width / 2, game.config.height - 85, 'O:ANQUAN', { fontFamily: 'PixelFont', fontSize: '170px', color: '#ff0000', align: 'center' }).setOrigin(.5).setAlpha(1)

          this.input.on('pointerdown', this.pickTile, this)
          this.input.on('pointermove', this.moveTile, this)
          this.input.on('pointerup', this.releaseTile, this)

     }
     reset() {
          this.scene.restart()
     }
     createLevel() {
          this.tilesArray = [];
          this.tileGroup = this.add.group();
          //   this.tileGroup.x = (game.config.width - gameOptions.tileSize * gameOptions.fieldSize.cols) / 2;
          //   this.tileGroup.y = (game.config.height - gameOptions.tileSize * gameOptions.fieldSize.rows) / 2;
          this.offsetX = (game.config.width - gameOptions.tileSize * gameOptions.fieldSize.cols) / 2;
          this.offsetY = 250;
          for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
               this.tilesArray[i] = [];
               for (var j = 0; j < gameOptions.fieldSize.cols; j++) {
                    this.addTile(i, j);
               }
          }
          this.placeNumbers();
     }
     placeNumbers() {
          var emptySpots = this.emptySpaces();


          // console.log(emptySpots.length)
          for (var i = 0; i < 3; i++) {
               var item = Phaser.Utils.Array.GetRandom(emptySpots);
               if (item) {
                    var randomValue = Phaser.Math.Between(2, 9);
                    this.tilesArray[item.y][item.x].value = randomValue;
                    this.tilesArray[item.y][item.x].setFrame(randomValue);
               }
          }
          var boardCheck = this.emptySpaces();
          if (boardCheck.length == 0) {
               this.statusText.setText('NO MORE MOVES')
               let timedEvent = this.time.addEvent({
                    delay: 2000,
                    callbackScope: this,
                    callback: function () {

                         this.reset()

                    }
               });
          }
     }
     addTile(row, col) {
          var tileXPos = this.offsetX + col * gameOptions.tileSize + gameOptions.tileSize / 2;
          var tileYPos = this.offsetY + row * gameOptions.tileSize + gameOptions.tileSize / 2;
          var theTile = this.add.sprite(tileXPos, tileYPos, "tiles");
          theTile.setOrigin(0.5);
          theTile.value = 0;
          theTile.picked = false;
          theTile.coordinate = new Phaser.Geom.Point(col, row);
          this.tilesArray[row][col] = theTile;
          this.tileGroup.add(theTile);
     }
     pickTile(e) {
          this.visitedTiles = [];
          this.visitedTiles.length = 0;
          var col = Math.floor((e.position.x - this.offsetX) / gameOptions.tileSize);
          var row = Math.floor((e.position.y - this.offsetY) / gameOptions.tileSize);
          if (this.validPick(row, col)) {
               //   console.log(col + ', ' + row)
               if (this.tilesArray[row][col].value > 0) {
                    this.tilesArray[row][col].alpha = 0.5;
                    this.visitedTiles.push(this.tilesArray[row][col].coordinate);
               }
          }
     }
     moveTile(e) {
          var col = Math.floor((e.position.x - this.offsetX) / gameOptions.tileSize);
          var row = Math.floor((e.position.y - this.offsetY) / gameOptions.tileSize);
          if (this.validPick(row, col)) {

               if (row != this.visitedTiles[this.visitedTiles.length - 1].y || col != this.visitedTiles[this.visitedTiles.length - 1].x) {
                    //  var distance = new Phaser.Geom.Point(e.position.x - this.tileGroup.x, e.position.y - this.tileGroup.y).distance(this.tilesArray[row][col]);
                    let distance = Phaser.Math.Distance.Between(e.x, e.y, this.tilesArray[row][col].x, this.tilesArray[row][col].y);
                    if (distance < gameOptions.tileSize * 0.4) {
                         var previousTileValue = this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].value;
                         if (!this.tilesArray[row][col].picked && this.checkAdjacent(new Phaser.Geom.Point(col, row), this.visitedTiles[this.visitedTiles.length - 1]) && previousTileValue > 1 && this.tilesArray[row][col].value == 0) {
                              this.tilesArray[row][col].picked = true;
                              this.tilesArray[row][col].alpha = 0.5;
                              this.tilesArray[row][col].value = previousTileValue - 1;
                              this.tilesArray[row][col].setFrame(previousTileValue - 1);
                              this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].value = 1;
                              this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].setFrame(1);
                              this.visitedTiles.push(this.tilesArray[row][col].coordinate);
                         }
                         else {
                              if (this.visitedTiles.length > 1 && row == this.visitedTiles[this.visitedTiles.length - 2].y && col == this.visitedTiles[this.visitedTiles.length - 2].x) {
                                   this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].value = 0;
                                   this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].setFrame(0);
                                   this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].picked = false;
                                   this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].alpha = 1;
                                   this.visitedTiles.pop();
                                   this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].value = previousTileValue + 1;
                                   this.tilesArray[this.visitedTiles[this.visitedTiles.length - 1].y][this.visitedTiles[this.visitedTiles.length - 1].x].setFrame(previousTileValue + 1)
                              }
                         }
                    }
               }
          }
     }
     releaseTile() {

          for (var i = 0; i < this.visitedTiles.length; i++) {
               this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].picked = false;
               this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].alpha = 1;
          }
          if (this.visitedTiles.length > 1) {

               for (i = 0; i < this.visitedTiles.length; i++) {
                    this.filled = [];
                    this.filled.length = 0;
                    this.floodFill(this.visitedTiles[i], this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].value);

                    if (this.filled.length > 1) {

                         console.log(this.filled.length * this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].value)
                         this.score += this.filled.length * this.tilesArray[this.visitedTiles[i].y][this.visitedTiles[i].x].value
                         this.scoreText.setText(this.score)
                         if (this.score > gameData.highScore) {
                              gameData.highScore = this.score
                              localStorage.setItem('Osave', JSON.stringify(gameData));
                              this.highText.setText(this.score)
                         }
                         for (var j = 0; j < this.filled.length; j++) {
                              this.tilesArray[this.filled[j].y][this.filled[j].x].value = 0;
                              this.tilesArray[this.filled[j].y][this.filled[j].x].setFrame(0);
                         }
                    }
               }

               this.placeNumbers();
          }
     }
     emptySpaces() {
          var temp = []
          for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
               for (var j = 0; j < gameOptions.fieldSize.cols; j++) {
                    if (this.tilesArray[i][j].value == 0) {
                         temp.push(this.tilesArray[i][j].coordinate);
                    }
               }
          }
          return temp
     }
     checkAdjacent(p1, p2) {
          if (gameOptions.diagonal) {
               return (Math.abs(p1.x - p2.x) <= 1) && (Math.abs(p1.y - p2.y) <= 1);
          }
          else {
               return (Math.abs(p1.x - p2.x) == 1 && p1.y - p2.y == 0) || (Math.abs(p1.y - p2.y) == 1 && p1.x - p2.x == 0);
          }
     }
     floodFill(p, n) {
          if (p.x < 0 || p.y < 0 || p.x >= gameOptions.fieldSize.cols || p.y >= gameOptions.fieldSize.rows) {
               return;
          }
          if (this.tilesArray[p.y][p.x].value == n && !this.pointInArray(p)) {
               this.filled.push(p);
               this.floodFill(new Phaser.Geom.Point(p.x + 1, p.y), n);
               this.floodFill(new Phaser.Geom.Point(p.x - 1, p.y), n);
               this.floodFill(new Phaser.Geom.Point(p.x, p.y + 1), n);
               this.floodFill(new Phaser.Geom.Point(p.x, p.y - 1), n);
          }
     }
     pointInArray(p) {
          for (var i = 0; i < this.filled.length; i++) {
               if (this.filled[i].x == p.x && this.filled[i].y == p.y) {
                    return true;
               }
          }
          return false;
     }
     validPick(row, column) {

          return row >= 0 && row < gameOptions.fieldSize.rows && column >= 0 && column < gameOptions.fieldSize.cols && this.tilesArray[row] != undefined && this.tilesArray[row][column] != undefined;
     }
}

