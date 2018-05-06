//------------------------------------------------------------------------------
// Author  : @JeffProd
// Web     : https://jeffprod.com
// License : SEE LICENSE IN LICENSE
//------------------------------------------------------------------------------

const iviewEN = require('iview/dist/locale/en-US');
const fs = require('fs');
const filenamify = require('filenamify');
const validUrl = require('valid-url');
const electron = require('electron');
const remote = electron.remote;
const ipcRenderer = electron.ipcRenderer;
const dialog = electron.remote.dialog;
const shell = electron.shell;

iview.locale(iviewEN.default);
const MAX_WIN = 2;

ipcRenderer.on('ipc-done',function(){
    vue.winOpened--;
    if(vue.winOpened<=0) {vue.winOpened=0;}
    console.log('winOpened:',vue.winOpened);
    });

ipcRenderer.on('ipc-error',function(event, txt){
    vue.msgError += txt + '<br>';
    });

let vue = new Vue({
    el: '#app',

    data: {
        currentStep: 0,
        inputFile: '',
        defaultPath: remote.app.getPath('home'),
        w: 1024, // screenshot width
        h: 768, // screenshot height
        msgError: '',
        msgWarning: '',
        intervalID: 0,
        urls: [],
        result: '',
        percent: 0,
        done:0,
        initlength:0,
        winOpened: 0,
        outdir: remote.app.getPath('home')
        },

    methods: {

        selectFile: function() {
            let inputFile = dialog.showOpenDialog({
                title: 'Select text file containing URLs (1 per line)',
                message: 'Select text file containing URLs (1 per line)',
                defaultPath: this.defaultPath,
                properties: ['openFile'],
                filters: [
                    {name: 'Text', extensions: ['txt', 'csv']}
                    ]
                });
            if(!inputFile) {return;}
            this.inputFile = inputFile[0];
            this.defaultPath = this.inputFile;
            this.currentStep = 1;
            }, // selectFile

        selectOutdir: function() {
            let outputDir = dialog.showOpenDialog({
                title: 'Select output directory',
                message: 'Select output directory',
                defaultPath: this.outdir,
                properties: ['openDirectory', 'createDirectory']
                });
            if(!outputDir) {return;}
            this.outdir = outputDir[0];
            }, // selectOutdir

        process: function() {
            let wtmp = parseInt(this.w);
            let htmp = parseInt(this.h);
            if(!wtmp || wtmp<=0 || wtmp>9999) {
                this.$refs.formWidth.$el.getElementsByTagName('input')[0].focus();
                this.msgWarning = 'Width incorrect';
                return;
                }
            if(!htmp || htmp<=0 || htmp>9999) {
                this.$refs.formHeight.$el.getElementsByTagName('input')[0].focus();
                this.msgWarning = 'Height incorrect';
                return;
                }
            this.w = wtmp;
            this.h = htmp;
            this.currentStep = 2;
            this.msgError = '';
            this.msgWarning = '';
            this.result = '';
            this.percent = 0;
            this.done = 0;
            this.winOpened = 0;

            // text file to array
            let urlstmp = [];
            this.urls = [];
            try {
                urlstmp = fs.readFileSync(this.inputFile).toString().split('\n');
                }
            catch(err) {
                this.msgError += err + '<br>';
                return;
                }
            urlstmp.forEach(function(url) {
                url = url.trim();
                if(!url) {return;}
                vue.urls.push(url);
                });
            this.initlength = this.urls.length;
            this.intervalID = setInterval(this.screenshots, 500);
            }, // process

        goto: function(nb) {
            clearInterval(this.intervalID);
            this.msgWarning = '';
            this.msgError = '';
            this.currentStep = nb;
            },

        screenshots: function() {
            if(this.urls.length===0) {
                clearInterval(this.intervalID);
                this.addResult('Finished');
                return;
                }
            if(this.winOpened>=MAX_WIN) {
                console.log('winOpened:'+this.winOpened+'=>SKIP');
                return;
                }
            let u = this.urls.shift();
            this.done++;
            this.percent = parseInt((this.done/this.initlength)*100);
            if(!validUrl.isUri(u)) {
                this.addWarning('Not a valid URL : ' + u );
                return;
                }
            this.addResult('Screenshooting : ' + u );
            this.winOpened++;
            ipcRenderer.send('ipc-screenshot', {
                url: u, 
                outfile: this.outdir + '/' + filenamify(u, {replacement: '_'}) + '.jpg',
                w: this.w, 
                h: this.h
                });
            }, // screenshots

        addResult: function(txt) {
            this.result = txt;
            }, // addResult

        addWarning: function(txt) {
            this.msgWarning += txt + '<br>';
            }, // addResult

        openURL: function(url) {
            shell.openExternal(url);
            }

        } // methods
    }); // Vue
