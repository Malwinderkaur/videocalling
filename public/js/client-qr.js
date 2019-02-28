window.addEventListener('DOMContentLoaded', function () {
    var Vue = window.Vue;
    var VueQrcode = window.VueQrcode;
    Vue.component('qrcode', VueQrcode);

    var qrTimeout
    
    var app = new Vue({
        el: '#app',
        data: {
            endpoint:'',
            username:'',
            password:'',
            urlRadio:'',
            message:'',
            allowVideoChat: false,
            qrString:'',
            remainingQRDisplayTime: 15,
            video: {
                endpoint:'https://kroschu-videochat.herokuapp.com',
                username:'',
                password:'',
                resolution: '1280x720',
                isEntryMissing: function() {
                    return !app.video.endpoint || !app.video.username || !app.video.password || !app.video.resolution
                }
            },
            url: {
                nagarro: 'http://103.80.52.22:8000/sap/opu/odata/sap/ZLE_WM_SCANNER1_SRV/',
                s4p: 'https://webdisp.hoerbiger.sap:8085/sap/opu/odata/sap/ZLE_WM_003_SRV/',
                s4q: 'https://webdisp.hoerbiger.sap:8084/sap/opu/odata/sap/ZLE_WM_003_SRV/'
            }
        },
        methods: {
            generateQR: function() {
                app.message = ''
                if(app.video.isEntryMissing()) {
                    app.message = 'Please enter all the details'
                    app.qrString = ''
                } else {
                    
                    var json = {
                        video: app.video
                    }
                    app.qrString = JSON.stringify(json)

//                    app.remainingQRDisplayTime = 15
//                    if(qrTimeout) {
//                        clearTimeout(qrTimeout)
//                    }
//
//                    qrTimeout = setTimeout(()=> {
//                        app.countdownAndClearQR()
//                    }, 1000)
                }
            },
    
            clearQR: function() {
                app.qrString = ''
                app.password = ''
                if(qrTimeout) {
                    clearTimeout(qrTimeout)
                }
            },

            countdownAndClearQR: function() {
                app.remainingQRDisplayTime--
                if(app.remainingQRDisplayTime == 0) {
                    app.clearQR()
                } else {
                    if(qrTimeout) {
                        clearTimeout(qrTimeout)
                    }
                    qrTimeout = setTimeout(()=> {
                        app.countdownAndClearQR()
                    }, 1000)
                }
            },

            urlSelected: function() {
                app.endpoint = app.url[app.urlRadio]
            }
        }
    })
})



