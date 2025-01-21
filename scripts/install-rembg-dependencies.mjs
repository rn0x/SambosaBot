// scripts/install-rembg-dependencies.mjs

import { execSync } from 'child_process';

function checkIfInstalled(command) {
    try {
        execSync(command, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

function installPython() {
    console.log('Python not found. Please install Python 3.7 or higher.');
    process.exit(1);
}

function installPip() {
    try {
        console.log('Installing pip...');
        execSync('python -m ensurepip --upgrade', { stdio: 'inherit' });
        execSync('python -m pip install --upgrade pip', { stdio: 'inherit' });
    } catch (error) {
        console.error('Failed to install pip.');
        process.exit(1);
    }
}

function installRembg() {
    try {
        console.log('Installing rembg...');
        execSync('pip install "rembg[cli]"', { stdio: 'inherit' });
    } catch (error) {
        console.error('Failed to install rembg.');
        process.exit(1);
    }
}

// دالة لتثبيت المتطلبات الخاصة بـ rembg
function installRembgDependencies() {
    // تحقق من وجود Python
    if (!checkIfInstalled('python --version') && !checkIfInstalled('python3 --version')) {
        installPython();
    }

    // تحقق من وجود pip
    if (!checkIfInstalled('pip --version') && !checkIfInstalled('pip3 --version')) {
        installPip();
    }

    // تحقق من وجود rembg
    if (!checkIfInstalled('rembg --version')) {
        installRembg();
    }

    console.log('All rembg dependencies are installed.');
}


installRembgDependencies();