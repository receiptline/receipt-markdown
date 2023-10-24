/*
Copyright 2023 Open Foodservice System Consortium

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// QR Code is a registered trademark of DENSO WAVE INCORPORATED.

function initialize() {
    const lang = document.getElementById('lang');
    const linewidth = document.getElementById('linewidth');
    const landscape = document.getElementById('landscape');
    const linespace = document.getElementById('linespace');
    const dots = document.getElementById('dots');
    const cpl = document.getElementById('cpl');
    const printarea = document.getElementById('printarea');
    const charWidth = 12;
    const encoding = {
        '-': 'multilingual', 'ja': 'shiftjis', 'zh-Hans': 'gb18030', 'zh-Hant': 'big5', 'ko': 'ksc5601', 'th': 'tis620'
    };

    // update webview
    const update = () => {
        const printer = {
            cpl: Number(cpl.textContent),
            encoding: encoding[lang.value],
            spacing: linespace.checked
        };
        const svg = receiptline.transform(receiptmd, printer);
        const dom = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
        if (landscape.checked) {
            dom.style.transformOrigin = 'top left';
            dom.style.transform = `rotate(-90deg) translateX(-${linewidth.value}px)`;
        }
        while (printarea.hasChildNodes()) {
            printarea.removeChild(printarea.firstChild);
        }
        printarea.appendChild(dom);
    };

    // register language selectbox event listener
    lang.onchange = event => update();

    // register width slidebar event listener
    linewidth.oninput = event => {
        if (landscape.checked) {
            printarea.style.width = '576px';
            printarea.style.height = linewidth.value + 'px';
        }
        else {
            printarea.style.width = linewidth.value + 'px';
            printarea.style.height = 'auto';
        }
        dots.textContent = linewidth.value;
        cpl.textContent = linewidth.value / charWidth;
        // update receipt
        update();
    };

    // register landscape checkbox event listener
    landscape.onchange = event => {
        if (landscape.checked) {
            linewidth.min = 576;
            linewidth.max = 1152;
        }
        else {
            linewidth.min = 288;
            linewidth.max = 576;
        }
        // update width slidebar
        linewidth.value = 576;
        linewidth.oninput();
    };

    // register spacing checkbox event listener
    linespace.onchange = event => update();

    // language
    const l = window.navigator.language;
    switch (l.slice(0, 2)) {
        case 'ja':
            lang.value = 'ja';
            break;
        case 'zh':
            lang.value = /^zh-(tw|hk|mo|hant)/i.test(l) ? 'zh-Hant' : 'zh-Hans';
            break;
        case 'ko':
            lang.value = 'ko';
            break;
        case 'th':
            lang.value = 'th';
            break;
        default:
            lang.value = '-';
            break;
    }
    // initialize receipt
    linewidth.oninput();

    window.addEventListener('message', event => {
        receiptmd = event.data;
        update();
    });
}

let receiptmd = '';
