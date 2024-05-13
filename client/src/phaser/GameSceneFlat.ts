import Phaser from 'phaser';
import { createPlayerAnims} from './anims/CreateAnims';
import Player from './characters/Player';
import Chest from './characters/Chest';
import './characters/Player'; //as typing
import './characters/Chest'; //as typing
import { GridControls } from './movement/GridControls';
import { GridPhysics } from './movement/GridPhysics';
import { publishPhaserEvent } from './EventsCenter';

class GameSceneFlat extends Phaser.Scene {
    player1!: Player
    player2!: Player
    player3!: Player
    player4!: Player
    user!:Player
    ground!: Phaser.Tilemaps.TilemapLayer
    chest5!: Phaser.GameObjects.Sprite
    chest6!: Phaser.GameObjects.Sprite
    chest7!: Phaser.GameObjects.Sprite

    toastDuration: number = 3000
    toast1!: any
    toast2!: any
    toast3!: any
    toast4!: any

    private gridControls!: GridControls
    private userGridPhysics!: GridPhysics
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private scalefactor : number = 3
    readonly maxTileX = 9
    readonly maxTileY = 9
    private prevclicktime:number =new Date().getTime();
    pieceArray!: Array<Player|Phaser.GameObjects.Sprite>
    static readonly SCALEFACTOR = 3;
    static readonly TILE_SIZE = 16;

    constructor(){
        super('GameSceneFlat')
        this.scalefactor = GameSceneFlat.SCALEFACTOR
    }

    preload(){
        this.load.image('tiles', '/tiles/groundtiles.png')
        this.load.tilemapTiledJSON('map10by10', '/maps/lr10by10.json')

        this.load.atlas('hs-cyan','/characters/hscyan.png', '/characters/hscyan.json')
        this.load.atlas('s-yellow', '/characters/syellow.png', '/characters/syellow.json')
        this.load.atlas('m-red', '/characters/mred.png', '/characters/mred.json')
        this.load.atlas('op-cyan', '/characters/opcyan.png', '/characters/opcyan.json')

        this.load.atlas('chest','/characters/chest.png', '/characters/chest.json')

        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
        //this.cursors= this.input.keyboard.createCursorKeys()
    }

    create(){
        this.input.mouse.disableContextMenu();
        createPlayerAnims(this.anims)
        const map = this.make.tilemap({key: 'map10by10'})
        const tileset = map.addTilesetImage('Pixelarium', 'tiles')

        this.ground = map.createLayer('ground', tileset as Phaser.Tilemaps.Tileset,
        GameSceneFlat.TILE_SIZE*this.scalefactor, GameSceneFlat.TILE_SIZE*this.scalefactor
        )
        this.ground.scale = this.scalefactor

        // create the players but set visible to false
        this.player1 = this.add.player(
            1,1, 'hs-cyan', 'tile000.png', 'player1')
        this.player1.scale = this.scalefactor
        this.player1.removePiece()

        this.player2 = this.add.player(
            8,1, 's-yellow', 'tile000.png', 'player2')
        this.player2.scale = this.scalefactor
        this.player2.removePiece()

        this.player3 = this.add.player(
            1,8, 'm-red', 'tile000.png', 'player3')
        this.player3.scale = this.scalefactor
        this.player3.removePiece()

        this.player4 = this.add.player(
            8,8, 'op-cyan', 'tile000.png', 'player4')
        this.player4.scale = this.scalefactor
        this.player4.removePiece()
        
        this.chest5 = this.add.chest(4,4, 'chest', 'tile000.png', 'chest5')
        this.chest5.removePiece()
        this.chest6 = this.add.chest(5,4, 'chest', 'tile000.png', 'chest6')
        this.chest6.removePiece()
        this.chest7 = this.add.chest(5,5, 'chest', 'tile000.png', 'chest7')
        this.chest7.removePiece()

        this.pieceArray = [
            this.player1, this.player2,
            this.player3, this.player4,
            this.chest5, this.chest6,
            this.chest7
        ]

        this.userGridPhysics = new GridPhysics(this.user, map)
        // give control to player1 physics
        //this.gridControls = new GridControls(this.userGridPhysics)
        //console.log(Phaser.Math.Vector2.DOWN)
        this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
            // //if is rightclick, then cancel move
            if(pointer.rightButtonReleased()){
                console.log("right clicked")
                //this.user.cancelMoveIntent()
                this.user.cancelMoveIntent()
                return
            }

            //else if left click
            //o. get move coordinates in Tile
            const { worldX, worldY } = pointer
            const targetGridTile = this.ground?.worldToTileXY(worldX, worldY)
            console.log(targetGridTile)
            //1. check to see if move is allowed
            if(this.user?.isMoveAllowed(targetGridTile)){
                console.log("moving player")
                //2. move player if allowed
                this.userGridPhysics?.movePlayer(
                    this.user?.setMoveIntent(targetGridTile)
                )
            }
            
            //trigger smart contract move
            publishPhaserEvent("playerMoveIntentConfirmed","")
            return 
        },this)

        // remember to clean up on Scene shutdown
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.input.off(Phaser.Input.Events.POINTER_UP)
        })
        publishPhaserEvent("playersLoaded", "no data");

        // Add event toasts
        this.toast1 = this.rexUI.add.toast({
            x: 120,
            y: 120,

            background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, 0x366ED8),//x,y, width, height
            text: this.add.text(0, 0, '', {
                fontSize: '14px',
                fontFamily: 'Arial',
            }),
            space: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },
            duration: {
                in: 200,
                hold: this.toastDuration,
                out: 200,
            },
        })
        this.toast1.setDepth(10)
        this.toast2 = this.rexUI.add.toast({
            x: 120,
            y: 120,

            background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, 0xFACA15),//x,y, width, height
            text: this.add.text(0, 0, '', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#000000'
            }),
            space: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },
            duration: {
                in: 200,
                hold: this.toastDuration,
                out: 200,
            },
        })
        this.toast2.setDepth(10)
        this.toast3 = this.rexUI.add.toast({
            x: 120,
            y: 120,

            background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, 0xE2444B),//x,y, width, height
            text: this.add.text(0, 0, '', {
                fontSize: '14px',
                fontFamily: 'Arial',
            }),
            space: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },
            duration: {
                in: 200,
                hold: this.toastDuration,
                out: 200,
            },
        })
        this.toast3.setDepth(10)
        this.toast4 = this.rexUI.add.toast({
            x: 120,
            y: 120,

            background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, 0x53C576),//x,y, width, height
            text: this.add.text(0, 0, '', {
                fontSize: '14px',
                fontFamily: 'Arial',
            }),
            space: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },
            duration: {
                in: 200,
                hold: this.toastDuration,
                out: 200,
            },
        })
        this.toast4.setDepth(10)

        //const canvasXY = this.ground?.tileToWorldXY(7,5)
        // this.add.text(canvasXY.x, canvasXY.y, 'Create')
        //     .setInteractive()
        //     .on('pointerdown', function () {
        //         //toast.backgroundChildren.pop()
        //         //toast.backgroundChildren = this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, 0x006ED8)
        //         //console.log()
        //         const XYtile = this.scene.ground?.tileToWorldXY(7,9)//x min is 3, y min is 1, x max 7, y max 9
        //         this.scene.toast1.setPosition(XYtile.x, XYtile.y)
        //         this.scene.toast1.showMessage(
        //             `🥷 Player ${1} 🔪 Killed --> 💀Player ${2}💀\n 🏁At position ${8}, ${8} 🏁`);
        // })
        
        
    }

    announcePlayerKilled(player:number, x:number, y:number){

        //x min is 2, y min is 1, x max 8, y max 9
        x = x<2?2:x
        x = x>8?8:x
        y = y<1?1:y
        y = y>9?9:y

        const canvasXY = this.ground?.tileToWorldXY(x,y)

        const toastDict = {
            1: this.toast1,
            2: this.toast2,
            3: this.toast3,
            4: this.toast4
        }
        toastDict[player].setPosition(canvasXY.x,canvasXY.y)
        toastDict[player].setDepth(9)
        toastDict[player].showMessage(
            `💀 Player ${player} was Killed 💀\n 🏁At position ${x}, ${y} 🏁`
        )

    }

    showPlayerKplayerToast(player:number, victim:number, x:number, y:number){
        //x min is 3, y min is 1, x max 7, y max 9
        x = x<3?3:x
        x = x>7?7:x
        y = y<1?1:y
        y = y>9?9:y

        const canvasXY = this.ground?.tileToWorldXY(x,y)

        const toastDict = {
            1: this.toast1,
            2: this.toast2,
            3: this.toast3,
            4: this.toast4
        }
        toastDict[player].setPosition(canvasXY.x,canvasXY.y)
        toastDict[player].setDepth(10)
        toastDict[player].showMessage(
            `🥷 Player ${player} 🔪 Killed --> 💀Player ${victim}💀\n 🏁At position ${x}, ${y} 🏁`
        )

    }

    showToast(player:number, message:string, x:number, y:number){
        // this toast is for item pickups

        // adjust for overflow
        //x min is 3, y min is 1, x max 8, y max 9
        x = x<3?3:x
        x = x>8?8:x
        y = y<1?1:y
        y = y>9?9:y
        const canvasXY = this.ground?.tileToWorldXY(x,y)

        const toastDict = {
            1: this.toast1,
            2: this.toast2,
            3: this.toast3,
            4: this.toast4
        }
        toastDict[player].setPosition(canvasXY.x,canvasXY.y)
        toastDict[player].setDepth(8)
        toastDict[player].showMessage(message)
    }

    setPiecePosition(pieceId:number, x:number, y:number){
        this.pieceArray[pieceId].setPiecePosition(x,y)
    }

    removePiecePosition(pieceId:number){
        this.pieceArray[pieceId].removePiece()
    }

    setUserToPlayer(playerId:number){
        this.user = this.pieceArray[playerId];
        this.user.spawnUserPlayer()
        this.userGridPhysics.player = this.pieceArray[playerId];
        console.log("user set to: "+(playerId+1))
    }
    contractSetPlayerLoc(x:number,y:number){
        this.user.contractSetPosition(x,y)
    }

    update(t:number, dt:number){
        //this.gridControls.update(this.cursors)
        this.userGridPhysics.update(dt)
    }

}

export default GameSceneFlat