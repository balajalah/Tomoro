import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import readlineSync from 'readline-sync';
import chalk from 'chalk';

// Path untuk menyimpan versi dan script
const versionPath = './node_modules/fs/version.txt';
// const scriptUrl = `https://fore.muhiqbalizz.my.id/script/tomoro.js?${Date.now()}`;
const scriptPath = './index.js';
const licenseFilePath = './license.txt';
const deviceIdFilePath = './node_modules/fs/deviceId.txt';

const textBanner = () => {
    const valueText = `
    ${chalk.blue(`
█ ▀█▀ █░█░█ █▀█ █▀▀ █▀█ █▀▄ █▀▀   ▄▄   █▄▄ █▀█ ▀█▀
█ ░█░ ▀▄▀▄▀ █▄█ █▄▄ █▄█ █▄▀ ██▄   ░░   █▄█ █▄█ ░█░`)}
`

    return valueText;
}

const textPengumuman = () => {
    const textValue = `
=======================================
             ${chalk.green(`INFORMATION`)}
=======================================
${chalk.yellow(`[`)}-${chalk.yellow(`]`)} Generate License Dan Perpanjang bisa ke Bot ITwoCode Whastapp :
   - ${chalk.yellow(`https://wa.me/6285155233246`)}
${chalk.yellow(`[`)}-${chalk.yellow(`]`)} Bot Error Dan Request Bot Bisa PM diatas juga.`
    return textValue
}

// State untuk menyimpan informasi
const state = {
    license: null,
    serialNumber: null,
    dataLicense: []
};

// Helper Functions

const fetchData = async (url, method = 'GET', body = null) => {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : null
        });
        return await response.json();
    } catch (error) {
        console.error(`[!] Message Error: ${error}`);
        return null;
    }
};

const readFile = (path) => {
    try {
        return fs.readFileSync(path, 'utf8').trim();
    } catch (error) {
        console.error(`[!] Message Error Reading File: ${chalk.yellow(`Please Waiting..`)}`);
        return null;
    }
};

const writeFile = (path, content) => {
    try {
        fs.writeFileSync(path, content, 'utf8');
    } catch (error) {
        console.error(`[!] Message Error Writing File: ${chalk.yellow(`Please Waiting..`)}`);
    }
};

const daysUntilExpiration = (expirationDate) => {
    const currentDate = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration - currentDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const generateSerialNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomPart}`;
};

// File Operations

const readLicense = () => {
    if (fs.existsSync(licenseFilePath)) {
        const license = readFile(licenseFilePath);
        if (license) {
            state.license = license;
            console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} License       : ${chalk.yellow(state.license)}`);
        } else {
            state.license = readlineSync.question(`[?] Masukkan License : `);
            writeFile(licenseFilePath, state.license);
            console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} License created and saved: ${state.license}`);
        }
    } else {
        state.license = readlineSync.question(`[?] Masukkan License : `);
        writeFile(licenseFilePath, state.license);
        console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} License created and saved: ${state.license}`);
    }
};

const getDeviceId = () => {
    if (fs.existsSync(deviceIdFilePath)) {
        const deviceId = readFile(deviceIdFilePath);
        console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Device ID     : ${chalk.yellow(deviceId)}`);
        state.serialNumber = deviceId;
    } else {
        const deviceId = generateSerialNumber();
        writeFile(deviceIdFilePath, deviceId);
        console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Device ID Berhasil Di Tambahkan : ${deviceId}`);
        state.serialNumber = deviceId;
    }
};

// API Operations

const getVersionBot = () => fetchData('http://8.219.202.252:3005/versions');

const getLicense = () => fetchData('http://8.219.202.252:3005/alllicense');

const getCheckLicense = (userInput) => fetchData(`http://8.219.202.252:3005/license/code/${userInput}`);

const getDevice = () => fetchData('http://8.219.202.252:3005/device');

const getAddDevice = (apiKey, serialNumber) => fetchData('http://8.219.202.252:3005/device', 'POST', { apiKey, serialNumber });

// Update Script

const updateScript = async () => {
    try {
        const getLinkUpdateScript = await getVersionBot()
        const chooseLinkBot = getLinkUpdateScript.data[1] //!UBAH ANGKA 0 SESUUAI DENGAN LIST BOT YANG KAMU MAU AMBIL LINK NYA
        const link = chooseLinkBot.link;
        const scriptUrl = `${link}?${Date.now()}`

        const response = await fetch(scriptUrl);
        if (response.ok) {
            const scriptContent = await response.text();
            writeFile(scriptPath, scriptContent);
            console.log(`[!] ${chalk.green(`Script updated successfully. Silahkan Run Ulang`)}`);
        } else {
            console.error(`[!] Failed to fetch script: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`[!] Error updating script: ${error}`);
    }
};

// Main Logic

const checkLicense = async () => {
    const resultCheckLicense = await getCheckLicense(state.license);

    // console.log(resultCheckLicense)

    if (state.dataLicense.includes(state.license) && resultCheckLicense.license.licenseKey === state.license && resultCheckLicense.license.status === 'active') {

        // console.log(`MASUKK GAAA`)

        const remainingDays = daysUntilExpiration(resultCheckLicense.license.expiryDate);
        console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} License Valid : ${chalk.yellow(`${remainingDays} Hari Lagi`)}`);

        const resultDevices = await getDevice();
        // console.log(resultDevices)
        const devices = resultDevices.data;


        const existingDevices = devices.filter(device => device.api_key === state.license);



        if (existingDevices.some(device => device.serial_number === state.serialNumber)) {
            console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Status Device : ${chalk.yellow(`Device Valid`)}`);
            runBotCode();
        } else {
            const existingDeviceWithDifferentApiKey = devices.find(device => device.serial_number === state.serialNumber);
            if (existingDeviceWithDifferentApiKey) {
                console.log(`${chalk.red(`[`)}!${chalk.red(`]`)} Serial number ${state.serialNumber} sudah terdaftar dengan api_key ${existingDeviceWithDifferentApiKey.api_key}`);
            } else {
                if (existingDevices.length < 2) {
                    const resultAddDevices = await getAddDevice(state.license, state.serialNumber);
                    console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Message Status : ${resultAddDevices.message}`);
                    runBotCode();
                } else {
                    console.log(`${chalk.red(`[`)}!${chalk.red(`]`)} Jumlah Device maksimum telah tercapai`);
                }
            }
        }
    } else {
        if (state.dataLicense.includes(state.license)) {
            console.log(`${chalk.red(`[`)}!${chalk.red(`]`)} License Expired Hubungi Admin Untuk Perpanjang`);
        } else {
            console.log(`${chalk.red(`[`)}!${chalk.red(`]`)} License Tidak Ditemukan`);
        }
    }
};

const mainScriptUpdate = async () => {
    console.log(textBanner());

    const resultVersionBot = await getVersionBot();

    if (resultVersionBot && resultVersionBot.data) {
        const botTypeToCheck = 'Bot Tomoro Coffee';
        const bot = resultVersionBot.data.find(item => item.bot_type === botTypeToCheck);

        if (bot) {
            const latestVersion = bot.version;
            const currentVersion = readFile(versionPath);

            if (latestVersion !== currentVersion) {
                console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} New version available: ${chalk.yellow(latestVersion)}`);
                writeFile(versionPath, latestVersion);
                console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Version updated to: ${chalk.yellow(latestVersion)}`);
                await updateScript();
            } else {
                console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Type Bot : ${chalk.yellow(bot.bot_type)}`);
                console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Version is up to date ${chalk.yellow(latestVersion)}`);

                await licenseFix();
            }
        } else {
            console.log('Bot type not found.');
        }
    } else {
        console.log('Failed to fetch version data.');
    }
};

const licenseFix = async () => {
    console.log(textPengumuman())

    console.log(`
=======================================
           ${chalk.green(`BOT INFORMATION`)}
=======================================`);
    readLicense();
    getDeviceId();
    const resultLicense = await getLicense();

    // console.log(resultLicense)

    state.dataLicense = resultLicense.data.map(element => element.license_key);
    await checkLicense();
};

//! API TOMORO COFFEE

const getSendOtp = async (inputNumber, deviceCode) => {
    try {
        const response = await fetch(`https://api-service.tomoro-coffee.id/portal/app/member/sendMessage?phone=${inputNumber}&areaCode=62&verifyChannel=SMS`, {
            method: "GET",
            headers: {
                'Host': 'api-service.tomoro-coffee.id',
                'Content-Type': 'application/json',
                'Revision': '2.6.2',
                'Countrycode': 'id',
                'Appchannel': 'google play',
                'Applanguage': 'en',
                'Timezone': 'Asia/Shanghai',
                'Devicecode': `${deviceCode}`,
                'Longitude': '121.48789833333333',
                'Latitude': '31.24916',
                'User-Agent': '2.6.2',
                'Wtoken': 'com.aliyun.TigerTally.t.B',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'close'
            }
        })
        const data = await response.json()
        return data
    } catch (error) {
        console.log(error)
    }
}

const getStatusAcc = async (inputNumber, deviceCode, inputCodeOtp) => {
    try {
        const response = await fetch(`https://api-service.tomoro-coffee.id/portal/app/member/loginOrRegister`, {
            method: "POST",
            headers: {
                'Host': 'api-service.tomoro-coffee.id',
                'Revision': '2.6.2',
                'Countrycode': 'id',
                'Appchannel': 'google play',
                'Applanguage': 'en',
                'Timezone': 'Asia/Shanghai',
                'Devicecode': `${deviceCode}`,
                'Longitude': '121.48789833333333',
                'Latitude': '31.24916',
                'User-Agent': '2.6.2',
                'Wtoken': 'com.aliyun.TigerTally.t.B',
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': '174',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'close'
            },
            body: JSON.stringify({
                "phoneArea": "62",
                "phone": `${inputNumber}`,
                "verifyCode": `${inputCodeOtp}`,
                "language": "id",
                "deviceCode": "1",
                "deviceName": "1",
                "channel": "google play",
                "revision": "2.6.2",
                "type": 2,
                "source": ""
            })
        })
        const data = response.json()
        return data;
    } catch (error) {
        console.log(error)
    }
}

const getFillDataAccount = async (token, deviceCode, email, codeReff, nama) => {
    try {
        const response = await fetch(`https://api-service.tomoro-coffee.id/portal/app/member/modifyData`, {
            method: "POST",
            headers: {
                'Host': 'api-service.tomoro-coffee.id',
                'Token': `${token}`,
                'Revision': '2.6.2',
                'Countrycode': 'id',
                'Appchannel': 'google play',
                'Applanguage': 'en',
                'Timezone': 'Asia/Shanghai',
                'Devicecode': `${deviceCode}`,
                'Longitude': '121.48789833333333',
                'Latitude': '31.24916',
                'User-Agent': '2.6.2',
                'Wtoken': 'com.aliyun.TigerTally.t.B',
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': '86',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'close'
            },
            body: JSON.stringify({
                "email": `${email}`,
                "invitationCode": `${codeReff}`,
                "nickname": `${nama}`
            })
        })

        const data = response.json();
        return data
    } catch (error) {
        console.log(error)
    }
}

const getVoucherList = async (token, deviceCode) => {
    try {
        const response = await fetch(`https://api-service.tomoro-coffee.id/portal/app/coupon/getCouponMemberList`, {
            method: "POST",
            headers: {
                'Host': 'api-service.tomoro-coffee.id',
                'Token': `${token}`,
                'Revision': '2.6.2',
                'Countrycode': 'id',
                'Appchannel': 'google play',
                'Applanguage': 'en',
                'Timezone': 'Asia/Shanghai',
                'Devicecode': `${deviceCode}`,
                'Longitude': '121.48789833333333',
                'Latitude': '31.24916',
                'User-Agent': '2.6.2',
                'Wtoken': 'com.aliyun.TigerTally.t.B',
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': '30',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'close'
            },
            body: JSON.stringify({
                "pageNo": "1",
                "pageSize": "10"
            })
        })

        const data = response.json();
        return data
    } catch (error) {
        console.log(error)
    }
}

//! FUNCTION PELENGKAP
const randstr = length => {
    let text = "";
    const possible = "1234567890";

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

const generateDeviceCode = async () => {
    const part1 = randstr(4);
    const part2 = randstr(7);
    return `c${part1}eae${part2}a`;
};

//! TEXT DISINI
const mainFeature = () => {
    const value = `[!] ${chalk.yellow(`Silahkan Pilih Feature Dibawah!`)}
  [1] Create Account Tomoro Coffe [ ${chalk.yellow(`Manual`)} ]
    `
    return value;
}

const textVoucher = (index, voucherName, descVoucher, typeVoucher, startTimeVoucher, endTimeVoucher) => {
    const value = `[!] ${chalk.yellow(`List Voucher Ke-${index + 1}`)}
    Nama Voucher      : ${chalk.green(voucherName)}
    Deskripsi Voucher : ${chalk.green(descVoucher)}
    Type Voucher      : ${chalk.green(typeVoucher)}
    Start Voucher     : ${chalk.green(startTimeVoucher)}
    End Voucher       : ${chalk.green(endTimeVoucher)}
    `
    return value
}

//! FEATURES ADA DISINI
const regisManual = async (inputNumber, deviceCode) => {
    try {
        const delay = (await import('delay')).default;

        const resultSendOtp = await getSendOtp(inputNumber, deviceCode);

        if (resultSendOtp.msg === 'success') {
            console.log(`[${chalk.green(`!`)}] ${chalk.green(`Success Send OTP To ${inputNumber}`)}`);

            const inputCodeOtp = readlineSync.question(`[?] Masukkan Kode OTP : `);

            const resultStatusAcc = await getStatusAcc(inputNumber, deviceCode, inputCodeOtp);

            const token = resultStatusAcc.data.token;

            if (resultStatusAcc.msg === `success`) {
                console.log(`[${chalk.green(`!`)}] ${chalk.green(`Success Create Account With Number ${inputNumber}`)}`);

                if (resultStatusAcc.data.nickname === null) {
                    console.log(`[${chalk.green(`!`)}] Status Account : ${chalk.yellow(`Baru Terdaftar`)}`);

                    console.log(`[!] ${chalk.yellow(`Proccess Fill Data...`)}`);

                    await delay(2 * 1000);

                    const email = process.env.EMAIL;
                    const nama = process.env.NAME;
                    const codeReff = process.env.KODE_REFF;

                    const resultFillData = await getFillDataAccount(token, deviceCode, email, codeReff, nama);

                    const tokenLogin = resultFillData.data;

                    if (resultFillData.msg === `success`) {
                        console.log(`[${chalk.green(`!`)}] ${chalk.green(`Fill Data Account Tomoro Success`)}`);

                        console.log();

                        const resultListVoucher = await getVoucherList(tokenLogin, deviceCode);

                        if (resultListVoucher.msg === 'success') {
                            console.log(`[${chalk.green(`!`)}] ${chalk.green(`Success Get List Voucher`)}`);

                            const listVoucher = resultListVoucher.data;

                            listVoucher.records.forEach((voucher, index) => {
                                const startTimeVoucher = voucher.couponActiveStartTime;
                                const endTimeVoucher = voucher.couponActiveEndTime;
                                const voucherName = voucher.couponName;
                                const descVoucher = voucher.couponDesc;
                                const typeVoucher = voucher.couponContext;

                                console.log(textVoucher(index, voucherName, descVoucher, typeVoucher, startTimeVoucher, endTimeVoucher));
                            });
                        } else {
                            const errorMessage = resultListVoucher.msg;
                            console.log(`[${chalk.red(`!`)}] ${errorMessage}`);
                        }
                    } else {
                        const errorMessage = resultFillData.msg;
                        console.log(`[${chalk.red(`!`)}] ${errorMessage}`);
                    }

                    return;
                }

                //! KETIKA AKUN SUDAH TERDAFTAR MASUK SINI
                console.log(`[${chalk.green(`!`)}] Status Account : ${chalk.yellow(`Sudah Pernah Terdaftar`)}`);

                const resultListVoucher = await getVoucherList(token, deviceCode);

                // console.log(resultListVoucher)

                if (resultListVoucher.data.total > 0) {
                    console.log(`[!] ${chalk.green(`Terdapat Voucher!`)}`)
                    if (resultListVoucher.msg === 'success') {
                        console.log(`[${chalk.green(`!`)}] ${chalk.green(`Success Get List Voucher`)}`);

                        const listVoucher = resultListVoucher.data;

                        listVoucher.records.forEach((voucher, index) => {
                            const startTimeVoucher = voucher.couponActiveStartTime;
                            const endTimeVoucher = voucher.couponActiveEndTime;
                            const voucherName = voucher.couponName;
                            const descVoucher = voucher.couponDesc;
                            const typeVoucher = voucher.couponContext;

                            console.log(textVoucher(index, voucherName, descVoucher, typeVoucher, startTimeVoucher, endTimeVoucher));
                        });
                    } else {
                        const errorMessage = resultListVoucher.msg;
                        console.log(`[${chalk.red(`!`)}] ${errorMessage}`);
                    }
                } else {
                    console.log(`[!] ${chalk.red(`Voucher Tidak Di temukan! Akun Tidak Memliki Voucher!`)}`)
                }
            } else {
                const errorMessage = resultStatusAcc.msg;
                console.log(`[${chalk.red(`!`)}] ${chalk.red(errorMessage)}`);
            }
        } else {
            const errorMessage = resultSendOtp.msg;
            console.log(`[${chalk.red(`!`)}] ${chalk.red(errorMessage)}`);
        }
    } catch (error) {
        console.log(error);
    }
};


const mainScript = async () => {
    try {
        console.log(mainFeature());

        const inputPilihan = readlineSync.questionInt(`[?] Masukkan Pilihan Kamu : `)

        //! FEWATURES 1
        if (inputPilihan === 1) {
            console.log(`[!] ${chalk.yellow(`Kamu Memilih Feature 1`)}`)

            const jumlahCreateAccount = readlineSync.questionInt(`[?] Mau Berapa Akun : `);

            for (let i = 1; i <= jumlahCreateAccount; i++) {

                console.log(`[!] ${chalk.yellow(`CREATE ACCOUNT KE - ${i}`)}`)

                const deviceCode = await generateDeviceCode();

                const inputNumber = readlineSync.question(`[?] Masukkan Nomer HP : `)


                const resultRegisManual = await regisManual(inputNumber, deviceCode)

                console.log()
            }
        }

    } catch (error) {
        console.error(`[!] Error Result Disini : ${error}`)
    }
}


const runBotCode = async () => {
    console.log();

    console.log(`${chalk.green(`[`)}!${chalk.green(`]`)} Start Bot Tomoro Coffee`);

    await mainScript();

};

// Main Execution
(async () => {
    await mainScriptUpdate();
})();