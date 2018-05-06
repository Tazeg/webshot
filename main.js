//------------------------------------------------------------------------------
// Author  : @JeffProd
// Web     : https://jeffprod.com
// License : SEE LICENSE IN LICENSE
//------------------------------------------------------------------------------

const fs = require('fs');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

let mainWindow = null;
const mainUrl = 'file://'+__dirname+'/app/index.html';

const isAlreadyRunning = app.makeSingleInstance(function() {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
        mainWindow.show();
        }
    });
if (isAlreadyRunning) { app.exit(); }

app.on('ready', function() {

    mainWindow  = new BrowserWindow({
        center: true,
        width: 800,
        height: 600,
        resizable: false,
        icon: __dirname + '/app/img/icon_app.png'
        });

    mainWindow.webContents.openDevTools();
    //mainWindow.maximize();

    mainWindow.on('closed', function() {
        mainWindow = null;
        app.quit();
        });

    // remove default menus
    mainWindow.setMenu(null);
    mainWindow.loadURL(mainUrl);
    }); // app.on('ready'

/**
 * Open a browser window to make a screenshot
 * @param {Object} arg : {url: "http://...", outfile: "/home/user/tmp/img.jpg", w:1600, h:1200}
 */
ipcMain.on('ipc-screenshot', function(event, arg) {
    let winShots = new BrowserWindow({
        parent: mainWindow,
        width: arg.w,
        height: arg.h,
        show: false
        });
    winShots.loadURL(arg.url);
    winShots.webContents.on('did-finish-load', function() {
        if(winShots.isDestroyed()) {
            event.sender.send('ipc-done');
            return;
            }
        winShots.webContents.capturePage(function(image){
            fs.writeFile(arg.outfile, image.toJPEG(90), function(err) {
                if(!event.sender.isDestroyed()) {event.sender.send('ipc-done');}
                if (err) {
                    if(!event.sender.isDestroyed()) {event.sender.send('ipc-error', err.message);}
                    }
                if(!winShots.isDestroyed()) {winShots.close(); winShots = null;}
                }); // fs.writeFile
            }); // capturePage
        }); // winShots.webContents.on('did-finish-load'
    }); // ipcMain.on('ipc-screenshot'
