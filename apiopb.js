// Let's make it so IE doesn't freak out

if(typeof console === "undefined") { console = { log: function() {} } }
if(typeof console.time === "undefined") {
    console.time = function() {};
    console.timeEnd = function() {};
}


if (typeof debug === "undefined") {
    debug = {};
}

// Define url mappings to create the API functions on the fly
// [method, route, contentType]
var url_map = {
    authorize: ['POST', '/g/aaa/authorize', null],
    submitTwoFactorSelection: ['POST', '/g/aaa/two_factor_authenticate', 'application/json'],
    updateTwoFactorPreferences: ['POST', '/g/aaa/two_factor_authenticate/update', 'application/json'],
    twoFactorVerify: ['POST', '/g/aaa/two_factor_authenticate/verify', 'application/json'],
    updateUser: ['POST', '/g/user', 'application/json'],
    createUser: ['PUT', '/g/user', null],
    getAuth: ['GET', '/g/aaa/getauth', null],
    resendRegistrationEmail: ['POST', '/g/aaa/resend_registration_email', null],
    resendUserVerificationEmail: ['POST', '/g/aaa/resend_user_verification_email', null],

    /******************************************************************************
    * Managed Switches
    ******************************************************************************/
    getSwitchList: ['GET', '/g/managed_switch/list?is_detailed=true', null],
    updateSwitch: ['POST', '/g/managed_switch/control', 'application/json'],
    addSwitch: ['POST', '/g/managed_switch/add', 'application/json'],
    updateSwitchSettings: ['POST', '/g/managed_switch', 'application/json'],
    powerCycleCamera: ['POST', 'g/camera/power_cycle', 'application/json'],
    /******************************************************************************
    * Devices
    ******************************************************************************/
    getDeviceList: ['GET', '/g/list/devices', null],
    putDevice: ['PUT', '/g/device', 'application/json'],
    updateDevice: ['POST', '/g/device', 'application/json'],
    /******************************************************************************
    * Layouts
    ******************************************************************************/
    newLayout: ['PUT', '/g/layout', 'application/json'],

    /******************************************************************************
    * Annotations
    ******************************************************************************/
    searchAnnotations: ['GET', '/g/search/annotations', null],
    getAnnotation: ['GET', '/annt/annt/get', null],
    getAnnotationsRange: ['GET', '/g/annotations/range', 'application/json'],

    /******************************************************************************
    * unorganized
    ******************************************************************************/
    responderActivation: ['POST', '/g/responder', 'application/json'],
    updateAccount: ['POST', '/g/account', 'application/json'],
    actionAllOff: ['POST', '/g/action/alloff', 'application/json'],
    actionAllOn: ['POST', '/g/action/allon', 'application/json'],
    actionRecordNow: ['POST', '/g/action/recordnow', 'application/json'],
    actionRecordOff: ['POST', '/g/action/recordoff', 'application/json'],
    actionRestartDevice: ['POST', '/g/action/restart_device', 'application/json'],
    changePassword: ['POST', '/g/aaa/change_password', 'application/json'],
    forgotPassword: ['POST', '/g/aaa/forgot_password', 'application/json'],
    getBridgeBandwidthMetrics: ['GET', '/g/metric/bridgebandwidth', null],
    getCameraBandwidthMetrics: ['GET', '/g/metric/camerabandwidth', null],
    getCameraEventMetrics: ['GET', '/g/metric/cameraevents', null],
    getEventHistory: ['GET', '/g/event_history', null],
    getAuditLog: ['GET', '/g/audit_log', null],
    switchAccount: ['POST', '/g/aaa/switch_account', 'application/json'],
    putAccount: ['PUT', '/g/account', 'application/json'],
    searchNVPT: ['GET', '/g/search/contracts', null],
    sendFeedback: ['PUT', '/g/feedback', 'application/json'],
    getApplicationList: ['GET', '/g/application/list', null],
    getNotifications: ['GET', '/g/notification', null],
    getUINotifications: ['GET', '/g/uinotification', null],
    updateUINotification: ['POST', '/g/uinotification', 'application/json'],
    createAccountTerms: ['PUT', '/g/account/terms', 'application/json'],
    getAccountTerms: ['GET', '/g/account/terms', null],
    getUserTerms: ['GET', '/g/user/terms', null],
    acceptUserTerms: ['PUT', '/g/user/terms', 'application/json']
}


// Let's abstract away the API into an object
var API = function() {
    // DRY-ing out the dev process
    this.out = function(data) {
        if (debug.error) {
            console.log(data);
        }
    };

    var buildAPIRoutes = function() {
        for (var fname in url_map) {
            var args = url_map[fname];
            var method = args[0];
            var route = "https://login.eagleeyenetworks.com" + args[1];
            var content_type = args[2];

            // Build the API functions from the map
            this[fname] = function(fname, method, route, content_type){
                // This is the closure to make the ajax calls
                return function(success, failure, payload, statusCode){
                    var ctype = content_type || 'application/x-www-form-urlencoded; charset=UTF-8';
                    console.log("Genfunc", fname, method, route, ctype);
                    return $.ajax(route, {
                        type: method,
                        success: success,
                        error: failure,
                        contentType: content_type || 'application/x-www-form-urlencoded; charset=UTF-8',
                        dataType: 'json',
                        data: payload,
                        statusCode: statusCode
                    });
                }
            }(fname, method, route, content_type);
        }
    }

    buildAPIRoutes.bind(this)();
};

/******************************************************************************
* Login
******************************************************************************/

API.prototype.authenticate = function(success, failure, payload, statusCode) {
    payload.realm = 'eagleeyenetworks';
    return $.ajax('https://login.eagleeyenetworks.com/g/aaa/authenticate', {
        type: 'POST',
        success: success,
        error: failure,
        data: payload,
        dataType: 'json',
        statusCode: statusCode
    });
};

API.prototype.logout = function(success, failure, payload) {
    return $.ajax('/g/aaa/logout', {
        type: 'POST',
        success: success,
        error: failure
    });
};

/******************************************************************************
* User
******************************************************************************/

API.prototype.getUser = function(success, failure, payload, statusCode) {
   // send it without an id to get current user
    if(payload) {
        payload = 'id=' + payload;
    }

    return $.ajax('/g/user', {
        type: 'GET',
        data: payload,
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.deleteUser = function(success, failure, payload, statusCode) {
    return $.ajax('/g/user?id=' + payload, {
        type: 'DELETE',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};


/******************************************************************************
* Devices
******************************************************************************/
API.prototype.getDevice = function(success, failure, payload, statusCode, isCloudOnly) {
    payload = isCloudOnly ? payload + "&is_cloud_only=1" : payload + "&is_cloud_only=0";
    return $.ajax('/g/device', {
        type: 'GET',
        data: 'id=' + payload,
        dataType: 'json',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.getRTSPstreamURL = function(success, failure, camID){
    return $.ajax('/camera/command/rtsp_url_get?c=' + camID, {
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        success: success,
        error: failure
    });
};

/*
 * payload = {
 *      "name"      'something',
 *      "id":       'something',
 *      "bridge":   'something'
 * }
 */
API.prototype.attachCamera = function(payload) {
    api.getDevice(function(data) {

        var obj = {};
            obj.name = payload.name;
            obj.settings = {};
            obj.settings.bridge = payload.bridge;
            obj.id = payload.id;
            obj.guid = data.guid;

        data = obj;
        console.log(data);

        api.updateDevice(function(data2) {
            console.log(data2);
            },
            null,
            JSON.stringify(data))
        }, null, payload.id
    );
};

// api.ignoreCamera("100e4888")
API.prototype.ignoreCamera = function(payload) {
    api.getDevice(function(data) {

        var obj = {};
            obj.settings = {};
            obj.settings.bridge = null;
            obj.id = payload;

        data = obj;
        console.log(data);

        api.updateDevice(function(data2) {
            console.log(data2);
            },
            null,
            JSON.stringify(data))
        }, null, payload
    );
};

API.prototype.deleteCamera = function(success, failure, payload, statusCode) {
    return $.ajax('/g/device?id=' + payload, {
        type: 'DELETE',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

// Endpoint for calculated camera duty cylcle values. Payload is string of comma-separated list of esns. Can pass any number of esns, with increase in time to compute
API.prototype.getDeviceDutyCycle = function(success, failure, payload, statusCode) {
    return $.ajax('/g/api/v2/duty_cycle?devices=' + payload, {
        type: 'GET',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

// This deletes the bridge and wipes out all data with it
API.prototype.deleteDevice = function(success, failure, payload, statusCode) {
    return $.ajax('/g/device?id=' + payload + '&erase=1', {
        type: 'DELETE',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

/******************************************************************************
* Bad Analog Signal Actions
******************************************************************************/
// Reset camera - deletes bad_signal_camera filter
API.prototype.analogCameraReset = function(success, failure, esn, statusCode) {
    var url = '/g/api/v2/Camera/' + esn + '/Analog/ResetSignal';
    return $.ajax(url, {
        type: 'POST',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};
// Ignore bad analog signal on camera - sets ignore_bad_signal_camera schedule
API.prototype.analogCameraIgnore = function(success, failure, esn, statusCode) {
    var url = '/g/api/v2/Camera/' + esn + '/Analog/IgnoreSignal';
    return $.ajax(url, {
        type: 'POST',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};
// Listen for bad analog signal on camera - removes ignore_bad_signal_camera schedule
API.prototype.analogCameraListen = function(success, failure, esn, statusCode) {
    var url = '/g/api/v2/Camera/' + esn + '/Analog/ListenSignal';
    return $.ajax(url, {
        type: 'POST',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

/******************************************************************************
* Location Groups
******************************************************************************/
API.prototype.listLocationGroups = function(success, failure, statusCode) {
    var url = '/g/api/v2/LocationGroup';
    return $.ajax(url, {
        type: 'GET',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.createLocationGroup = function(success, failure, payload, statusCode) {
    var url = '/g/api/v2/LocationGroup';
    return $.ajax(url, {
        type: 'PUT',
        dataType: 'json',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(payload),
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.getLocationGroup = function(success, failure, location_group_id, statusCode) {
    var url = '/g/api/v2/LocationGroup/' + location_group_id;
    return $.ajax(url, {
        type: 'GET',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.updateLocationGroup = function(success, failure, payload, statusCode) {
    var url = '/g/api/v2/LocationGroup/' + payload.location_group_id;
    var update_payload = _.clone(payload);
    // NB: it would be better to keep the ID out of the payload altogether, and key locations by ID
    delete update_payload.location_group_id;
    return $.ajax(url, {
        type: 'POST',
        success: success,
        error: failure,
        dataType: 'json',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(update_payload),
        statusCode: statusCode
    });
};

API.prototype.deleteLocationGroup = function(success, failure, location_group_id, statusCode) {
    var url = '/g/api/v2/LocationGroup/' + location_group_id;
    return $.ajax(url, {
        type: 'DELETE',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

/******************************************************************************
* Layouts
******************************************************************************/

// api.getLayout(function(data) { console.log(data) }, null, '300eec2e-554f-11e2-8c4d-001c42a7f1d9');
API.prototype.getLayout = function(success, failure, payload) {
    return $.ajax('/g/layout', {
        type: 'GET',
        data: 'id=' + payload,
        success: success,
        error: failure
    });
};

/*
 * Example call
 *
 * api.newLayout(function(data) {
 *      console.log(data) },
 *      null,
 *      JSON.stringify({"name": "blah blah blah", "json": "{}", "types": ["desktop"]}) );
 */
API.prototype.newLayout = function(success, failure, payload, statusCode) {
    return $.ajax('/g/layout', {
        type: 'PUT',
        contentType: 'application/json',
        processData: false,
        data: payload,
        dataType: 'json',
        success: success,
        error: failure,
        statusCode: statusCode || {}
    });
};

/*
 * Example call
 *
 * api.getLayout(function(data) {
 *      d1 = {};
 *      d1.name = 'Layout Six';
 *      d1.id = data.id;
 *      api.updateLayout( null, null, JSON.stringify(d1)) },
 *      null,
 *      'ed7e4e0a-5c55-11e2-a60e-ca8312ea370c');
 */
API.prototype.updateLayout = function(success, failure, payload) {
    return $.ajax('/g/layout', {
        type: 'POST',
        data: payload,
        contentType: 'application/json',
        processData: false,
        dataType: 'json',
        success: success,
        error: failure
    });
};

// api.deleteLayout(null,null,'1ed03e8c-5c56-11e2-ac4c-ca8312ea370c')
API.prototype.deleteLayout = function(success, failure, payload) {
    return $.ajax('/g/layout?id=' + payload, {
        type: 'DELETE',
        success: success,
        failure: failure
    });
};

API.prototype.fetch = function(collection, success_cb, failure_cb) {
    var self = this;
    collection.fetch({
        success: success_cb,
        error: function(collection, response, options) {
            if (failure_cb) {
                failure_cb(collection, response, options);
            } else {
                var logged_statuses = [
                    408,
                    500,
                    502,
                    504
                ];
                if (logged_statuses.indexOf(response.status) >= 0) {
                    var user = userList.getCurrentUser();
                    var user_id = user ? user.get('id') : 'unknown user';
                    var account_id = user && user.account ? user.account.get('id') : 'unknown account';

                    self.logEvent(
                        'collection_fetch_error',
                        'Collection fetch from ' + collection.url + ' failed - ' + response.status + ': ' + response.statusText,
                        {
                            user_id: user_id,
                            account_id: account_id,
                            curr_hash: window.location.hash
                        }
                    );
                }
            }
        }
    });
};

/******************************************************************************
* Polling
******************************************************************************/

API.prototype.startPolling = function(success, failure, payload, statusCode) {
    var win = function(data) {
        dispatcher.trigger('initialPollingState', data);
        // keep calling poll

        // grab the cookie and sent is as a token
        //var token = (/ee-poll-ses=([\w]*)/.exec(document.cookie)) ? /ee-poll-ses=([\w]*)/.exec(document.cookie)[1] : ''
        if(data && data.token) {
            var token = data.token
        }

        // TODO: fix this so not calling the instance variable
        api.poll(success, failure, statusCode, token);

        if(success) {
            success(data);
        }
    };

    return $.ajax('/poll', {
        type: 'POST',
        data: payload,
        success: win,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.poll = function(success, failure, statusCode, token) {
    var win = function(data) {
        dispatcher.trigger('newPollingData', data);

        if(success) {
            success(data);
        }

        if( !stopPolling ) {
            // keep calling poll
            api.poll(success, failure, statusCode, token);
        }
    };

    return $.ajax('/poll?token=' + token, {
        type: 'GET',
        success: win,
        error: failure,
        statusCode: statusCode
    });
};

/******************************************************************************
* Videos
******************************************************************************/

/*
 *  Get a list of objects,
 *  where each object contains the ID, start and end timestamp of a single video clip.
 *
 *  Usage:
 *  api.getVideos(
        function(data) { console.log(data); },
 *      null,
 *      {'id': '2351179d', 'start_timestamp': 'now', 'end_timestamp': '-1d', 'count': '-10'}
 *   })
 *
 *  Arguments of data object/query string:
 *  @param {string}       id              camera id required (deprecated form: c)
 *  @param {string}       start_timestamp           required (deprecated form: t)
 *  @param {string}       end_timestamp             optional (deprecated form: e)
 *  @param {int}          count                     optional
 *  @param {string, enum} options                   optional
 *
 *  @return {List of Objects} [{s: "20190107145437.653", e: "20190107145505.612", id: 2583826922}]
 *
 */
API.prototype.getVideos = function(success, failure, payload) {
    var defaults = {
        start_timestamp: utils._epoch_DateToStr(Date.now() / 1000),
        end_timestamp:   utils._epoch_DateToStr((Date.now() - 86400000) / 1000), // last 24 hours
        count:           '-10'
    };

    var start_timestamp = payload.start_timestamp ? payload.start_timestamp : defaults.start_timestamp,
        end_timestamp = payload.end_timestamp ? payload.end_timestamp : defaults.end_timestamp,
        count = payload.count ? payload.count : defaults.count,

        // make it use ampersand delineation to match cache-busting
        query_string = [
            'id=' + payload.id,
            'start_timestamp=' + start_timestamp,
            'end_timestamp=' + end_timestamp,
            'count=' + count
        ].join('&');

    return $.ajax('/asset/list/video.flv', {
        type: 'GET',
        data: query_string,
        success: success,
        error: failure
    });
};


/******************************************************************************
 * Account
 ******************************************************************************/

API.prototype.getAccount = function(success, failure, payload, statusCode) {
    return $.ajax('/g/account', {
        type: 'GET',
        data: 'id=' + payload,
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.sendPerformanceData = function(UtilsObj) {
    if( typeof(UtilsObj) === 'object') {
        if(UtilsObj.storage && UtilsObj.storageDirty) {
            if(userList.getCurrentUser()) {
                UtilsObj.putStorage('user', userList.getCurrentUser().get('id'));
            }
            // send the data

            $.ajax('/g/client_log', {
                type: 'POST',
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify({"json": localStorage}) ,
                dataType: 'json',
                success: function() {
                    // reset the dirty flag
                    UtilsObj.storageDirty = false

                    // reset the object
                    UtilsObj.clearStorage();
                }
            });
        }
    }
};

/*********************************
 * VPN services
 **********************************/

// api.openVPN(api.out, api.out, {'bridge_id': cameraList.at(0).get('deviceBridges')[0][0], 'guid': cameraList.at(0).get('deviceGUID') }, {})
API.prototype.openVPN = function(success, failure, payload, statusCode) {
    return $.ajax('/g/cameratunnel', {
        type: 'PUT',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(payload),
        dataType: 'json',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.manageInterface = function(success, failure, payload, statusCode) {
    return $.ajax('g/bridge/manage/interfaces', {
        type: 'POST',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(payload),
        dataType: 'json',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

// api.closeVPN(api.out, api.out, {'bridge_id': cameraList.at(0).attributes.deviceBridges[0][0], 'guid': cameraList.at(0).attributes.deviceGUID }, {})
API.prototype.closeVPN = function(success, failure, payload, statusCode) {
    return $.ajax('/g/cameratunnel?bridge_id=' + payload.bridge_id + '&guid=' + payload.guid, {
        type: 'DELETE',
        success: success,
        error: failure,
        async: false,
        statusCode: statusCode
    });
};

API.prototype.deleteAccount = function(success, failure, payload, statusCode) {
    return $.ajax('/g/account?id=' + payload, {
        type: 'DELETE',
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.een_debug = function(flag) {
	if(flag === false) {
		debug.een_dubug = false;
		document.cookie = 'een_debug=false;';
	} else {
		debug.een_debug = true;
		document.cookie = 'een_debug=true;max-age=86400';
	}

}

/******************************************************************************
 * Recording
 ******************************************************************************/

API.prototype.searchRecordings = function(success, failure, payload, statusCode) {
    return $.ajax('/g/search/recordings', {
        type: 'GET',
        data: 'value=' + payload,
        success: success,
        error: failure,
        statusCode: statusCode
    });
};

API.prototype.getBrand = function(success, failure, payload, statusCode) {
    if(payload) {
        payload = 'subdomain=' + payload;
    }

    return $.ajax('/g/brand', {
        type: 'GET',
        data: payload,
        success: success,
        error: failure,
        statusCode: statusCode
    });
};


API.prototype.getAnalyticsData = function(success, failure, payload, statusCode){

    var query = _.map(payload, function(v,k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    }).join('&');


    return $.ajax('/g/analytics/aggregate?' + query,
    {
        type: 'GET',
        success: success,
        error: failure,
        statusCode: statusCode
    });
}

/******************************************************************************
* Applications/API Keys
******************************************************************************/
API.prototype.newApplication = function(success, failure, payload, statusCode) {
    return $.ajax('/g/application', {
        type: 'PUT',
        contentType: 'application/json',
        processData: false,
        data: payload,
        dataType: 'json',
        success: success,
        error: failure,
		statusCode: statusCode
    });
};


API.prototype.deleteApplication = function(success, failure, payload, statusCode) {
    return $.ajax('/g/application?id=' + payload, {
        type: 'DELETE',
        contentType: 'application/json',
        processData: false,
        success: success,
        failure: failure,
		statusCode: statusCode
    });
};

// Scalyr logging
// ejanik's new, improved scalyr log. Please use for all new logs.
API.prototype.logEvent = function(ev, message, extra, success, failure) {
    EventLogger.log(ev, message, extra, success, failure);
};

// Scalyr logs, throttled
API.prototype.clientLog = function(ev, message, extra, success, failure) {
    var last_sent = utils.getStorage(ev);
    var time_limit_mins = 3;
    // limit logs per user, so each unique event only gets logged at most once every X minutes
    if (!last_sent || (last_sent && (((new Date()).valueOf() / 1000) - (utils._epoch_StrToDate(last_sent)) > (time_limit_mins * 60)))) {
        var timestamp = utils._epoch_DateToStr(new Date() / 1000);
        if (!extra) { extra = {}; }
        extra.client_log_timestamp = timestamp;
        this.logEvent(ev, message, extra, success, failure);
        utils.putStorage(ev, timestamp);
    }
};

