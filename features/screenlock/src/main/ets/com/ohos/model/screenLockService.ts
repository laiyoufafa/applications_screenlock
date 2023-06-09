/*
 * Copyright (c) 2021-2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Log from '../../../../../../../../common/src/main/ets/default/Log';
import ScreenLockModel from './screenLockModel';
import AccountModel, {AuthType, AuthSubType, AuthTurstLevel} from './accountsModel'
import {ScreenLockStatus} from '../../../../../../../../common/src/main/ets/default/ScreenLockCommon';
import createOrGet from '../../../../../../../../common/src/main/ets/default/SingleInstanceHelper'
import Router from '@system.router';
import commonEvent from '@ohos.commonEvent';
import {Callback} from 'basic';

const TAG = 'ScreenLock-ScreenLockService';
const URI_DIGITALPASSWORD = 'pages/digitalPassword'
const URI_MIXEDPASSWORD = 'pages/mixedPassword'
const URI_CUSTOMPASSWORD = 'pages/customPassword'


//Event type name
const EVENT_BEGIN_WAKEUP: string = 'beginWakeUp'
const EVENT_END_WAKEUP: string = 'endWakeUp'
const EVENT_BEGIN_SCREENON: string = 'beginScreenOn'
const EVENT_END_SCREEN_ON: string = 'endScreenOn'
const EVENT_BEGIN_SCREENOFF: string = 'beginScreenOff'
const EVENT_END_SCREENOFF: string = 'endScreenOff'
const EVENT_UNLOCK_SCREEN: string = 'unlockScreen'
const EVENT_BEGIN_EXITANIMATION: string = 'beginExitAnimation'
const EVENT_BEGIN_SLEEP: string = 'beginSleep'
const EVENT_END_SLEEP: string = 'endSleep'
const EVENT_CHANGE_USER: string = 'changeUser'
const EVENT_SCREENLOCK_ENABLE: string = 'screenlockEnabled'

const UNLOCK_SCREEN_RESULT: string = 'unlockScreenResult'
const SCREENLOCK_DRAW_DONE: string = 'screenDrawDone'

const ACTIVATING_TYPE = "activating"
const ACTIVATE_TYPE = "activate"
const ACTIVATING_EVENT = "activatingEvent"
const ACTIVATE_EVENT = "activateEvent"

const CHALLENGE_INT = 0

const MAIN_USER = 100

export {AuthType, AuthSubType};

export enum UnlockResult {
    Success = 0,
    Fail = 1,
    Cancel = 2
}

let mRouterPath: string = ""

let mWillRecognizeFace: boolean = false

let mUnLockBeginAnimation: Callback<Callback<void>> = (callback: Callback<void>) => {
    callback()
}

export class ScreenLockService {
    accountModel: AccountModel = new AccountModel()
    screenLockModel: ScreenLockModel = new ScreenLockModel()

    init() {
        Log.showInfo(TAG, 'init');
        this.accountModel.modelInit();
        this.monitorEvents();
        this.accountModel.updateAllUsers()
        this.checkPinAuthProperty(() => {
            Log.showInfo(TAG, `checkPinAuthProperty back`)
            this.authUserByFace()
        })
    }

    monitorEvents() {
        Log.showInfo(TAG, 'registered events start');

        //Bright screen
        this.screenLockModel.eventListener(EVENT_END_SCREEN_ON, () => {
            Log.showInfo(TAG, `EVENT_END_SCREEN_ON event`);
            this.authUserByFace()
            AppStorage.SetOrCreate('deviceStatus', EVENT_END_SCREEN_ON);
        })

        //The device is going to sleep
        this.screenLockModel.eventListener(EVENT_BEGIN_SLEEP, () => {
            Log.showInfo(TAG, `EVENT_BEGIN_SLEEP event`);
            this.accountModel.updateAllUsers()
            this.lockScreen();
            AppStorage.SetOrCreate('deviceStatus', EVENT_BEGIN_SLEEP);
        })

        this.accountModel.eventListener(ACTIVATING_TYPE, ACTIVATING_EVENT, () => {
            Log.showInfo(TAG, `ACTIVATING_TYPE event`);
            this.lockScreen();
        })

        this.accountModel.eventListener(ACTIVATE_TYPE, ACTIVATE_EVENT, () => {
            Log.showInfo(TAG, `ACTIVATE_TYPE event`);
            this.accountModel.updateAllUsers()
            this.checkPinAuthProperty(() => {
                Log.showInfo(TAG, `checkPinAuthProperty back`)
                this.authUserByFace()
            })
        })

        //unlock request was received
        this.screenLockModel.eventListener(EVENT_UNLOCK_SCREEN, () => {
            Log.showInfo(TAG, `EVENT_UNLOCK_SCREEN event`);
            this.unlockScreen();
        });

        Log.showInfo(TAG, 'registered events end');
    }

    lockScreen() {
        Log.showInfo(TAG, `lockScreen`);
        let length = Router.getLength()
        Log.showInfo(TAG, `Router.getLength: ${length}`)
        for (let index = 1;index < length; index++) {
            Log.showInfo(TAG, `back to index`);
            Router.back();
        }
        //lock the screen
        this.screenLockModel.showScreenLockWindow(() => {
            Log.showInfo(TAG, `showScreenLockWindow finish`);
            this.checkPinAuthProperty(() => {
            });
            this.publish("common.event.LOCK_SCREEN");
        });
    }

    private checkPinAuthProperty(callback: Callback<void>) {
        Log.showInfo(TAG, "checkPinAuthProperty")
        this.accountModel.getAuthProperty(AuthType.PIN, (properties) => {
            Log.showInfo(TAG, `checkPinAuthProperty：AUTH_SUB_TYPE:${properties.authSubType}`);
            switch (properties.authSubType) {
                case AuthSubType.PIN_SIX:
                    Log.showInfo(TAG, "AuthSubType.PIN_SIX")
                    AppStorage.SetOrCreate('lockStatus', ScreenLockStatus.Locking);
                    mRouterPath = URI_DIGITALPASSWORD;
                    this.checkFaceAuthProperty(() => {
                        callback()
                    })
                    break;
                case AuthSubType.PIN_MIXED:
                    Log.showInfo(TAG, "AuthSubType.PIN_MIXED")
                    AppStorage.SetOrCreate('lockStatus', ScreenLockStatus.Locking);
                    mRouterPath = URI_MIXEDPASSWORD;
                    this.checkFaceAuthProperty(() => {
                        callback()
                    })
                    break;
                case AuthSubType.PIN_NUMBER:
                    Log.showInfo(TAG, "AuthSubType.PIN_NUMBER")
                    AppStorage.SetOrCreate('lockStatus', ScreenLockStatus.Locking);
                    mRouterPath = URI_CUSTOMPASSWORD;
                    this.checkFaceAuthProperty(() => {
                        callback()
                    })
                    break;
                default:
                    Log.showInfo(TAG, "lockStatus: unlocked")
                    AppStorage.SetOrCreate('lockStatus', ScreenLockStatus.Unlock);
                    mWillRecognizeFace = false
            }
        })
    }

    private checkFaceAuthProperty(callback: Callback<void>) {
        Log.showInfo(TAG, "checkFaceAuthProperty")
        this.accountModel.getAuthProperty(AuthType.FACE, (properties) => {
            Log.showInfo(TAG, `checkFaceAuthProperty：AUTH_SUB_TYPE:${properties.authSubType}`);
            switch (properties.authSubType) {
                case AuthSubType.FACE_2D:
                case AuthSubType.FACE_3D:
                    mWillRecognizeFace = true
                    callback()
                    break;
                default:
                    mWillRecognizeFace = false
            }
        })
    }

    unlockScreen() {
        Log.showInfo(TAG, `unlockScreen`);
        this.accountModel.isActivateAccount((isActivate: boolean) => {
            if (!isActivate) {
                Log.showInfo(TAG, "isActivitings")
                return
            }
            mUnLockBeginAnimation(() => {
                let status = AppStorage.Link('lockStatus')
                Log.showInfo(TAG, `unlocking lockStatus:${JSON.stringify(status?.get())}`);
                if (status?.get() == ScreenLockStatus.Unlock) {
                    Log.showInfo(TAG, `unlock the screen`);
                    this.unlocking();
                } else {
                    Log.showInfo(TAG, `unlockScreen Router.push`);
                    Router.push({ uri: mRouterPath });
                }
            })
        })
    }

    unlocking() {
        Log.showInfo(TAG, `unlocking`);
        //set the lockStatus to 'Unlock'
        AppStorage.SetOrCreate('lockStatus', ScreenLockStatus.Unlock);
        //unlock the screen
        this.screenLockModel.hiddenScreenLockWindow(() => {
            Log.showInfo(TAG, `hiddenScreenLockWindow finish`);
            //notify the base service that the unlock is completed
            this.notifyScreenResult(UnlockResult.Success);
            this.publish("common.event.UNLOCK_SCREEN");
        });
    }

    notifyScreenResult(result: UnlockResult) {
        Log.showInfo(TAG, `notifyScreenResult`);
        this.screenLockModel.sendScreenLockEvent(UNLOCK_SCREEN_RESULT, result, (error, data) => {
            Log.showInfo(TAG, `notifyScreenResult: error:${JSON.stringify(error)} data:${JSON.stringify(data)}`);
        });
    }

    notifyDrawDone() {
        Log.showInfo(TAG, `notifyDrawDone`);
        //notify the base service that the screen is loaded
        this.screenLockModel.sendScreenLockEvent(SCREENLOCK_DRAW_DONE, 0, (error, result) => {
            Log.showInfo(TAG, `notifyDrawDone:  error:${JSON.stringify(error)} result:${JSON.stringify(result)}`);
        });
    }

    authUser(authSubType: AuthSubType, passwordData: number[] | string, callback): void {
        Log.showInfo(TAG, `authUser  authSubType:${authSubType}`);
        let password: string = '';
        if (typeof passwordData == 'string') {
            password = passwordData;
        } else {
            password = passwordData.join('');
        }
        this.accountModel.registerPWDInputer(password).then(() => {
            Log.showInfo(TAG, `registerPWDInputer success`);
            this.accountModel.authUser(CHALLENGE_INT, AuthType.PIN, AuthTurstLevel.ATL4, (result, extraInfo) => {
                Log.showInfo(TAG, `authUser  callback:${result} extraInfo:${JSON.stringify(extraInfo)}`);
                this.accountModel.unregisterInputer();
                callback(result, extraInfo);
            })
        }).catch(() => {
            Log.showInfo(TAG, `registerPWDInputer fails`);
        })
    }

    authUserByFace() {
        if (!mWillRecognizeFace) {
            Log.showInfo(TAG, "Recognize face is not support")
            return
        }
        Log.showInfo(TAG, `authUserByFace`);
        this.accountModel.authUser(CHALLENGE_INT, AuthType.FACE, AuthTurstLevel.ATL1, (result, extraInfo) => {
            Log.showInfo(TAG, `authUserByFace callback:${result} extraInfo:${JSON.stringify(extraInfo)}`);
            if (result == 0) {
                AppStorage.SetOrCreate('lockStatus', ScreenLockStatus.Unlock);
                this.unlockScreen()
            } else {
                AppStorage.SetOrCreate('lockStatus', ScreenLockStatus.FaceNotRecognized);
            }
        })
    }

    onUserSwitch(userId: number) {
        this.accountModel.onUserSwitch(userId)
    }

    goBack() {
        Log.showInfo(TAG, `goBack`);
        Router.back();
        this.accountModel.unregisterInputer();
    }

    destroy() {
        this.screenLockModel.eventCancelListener(EVENT_END_SCREEN_ON);
        this.screenLockModel.eventCancelListener(EVENT_BEGIN_SLEEP);
        this.screenLockModel.eventCancelListener(EVENT_UNLOCK_SCREEN);
        this.accountModel.eventCancelListener(ACTIVATING_TYPE, ACTIVATING_EVENT);
        this.accountModel.eventCancelListener(ACTIVATE_TYPE, ACTIVATE_EVENT)
        this.accountModel.modelFinish()
    }

    setUnlockAnimation(beginAnimation: Callback<Callback<void>>) {
        mUnLockBeginAnimation = beginAnimation;
    }

    getAuthProperty(authType, callback) {
        Log.showInfo(TAG, `getAuthProperty param: authType ${authType}`);
        this.accountModel.getAuthProperty(authType, (properties) => {
            callback(properties);
        })
    }

    private publish(eventName: string) {
        Log.showInfo(TAG, `publish event name: ${eventName}`)
        commonEvent.publish(eventName, (error, value) => {
            if (error.code) {
                Log.showError(TAG, 'Operation failed. Cause: ' + JSON.stringify(error));
            } else {
                Log.showInfo(TAG, 'publish common event success. ' + JSON.stringify(value));
            }
        });
    }
}

let screenLockService = createOrGet(ScreenLockService, TAG);

export default screenLockService as ScreenLockService;