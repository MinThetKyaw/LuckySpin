const numInput = document.getElementById('numInput');
        const totalCountInput = document.getElementById('totalCountInput');
        const displayBox = document.getElementById('displayBox');
        const drawBtn = document.getElementById('drawBtn');
        const stopBtn = document.getElementById('stopBtn');
        const winnerList = document.getElementById('winnerList');
        const winnerTotalCount = document.getElementById('winnerTotalCount');
        const removeWinnerCheckbox = document.getElementById('removeWinner');
        const drawAmountInput = document.getElementById('drawAmount');
        const animDurationInput = document.getElementById('animDuration');
        const skipAnimationCheck = document.getElementById('skipAnimationCheck');
        const rangeFromInput = document.getElementById('rangeFrom');
        const rangeToInput = document.getElementById('rangeTo');

        let winnerCount = 0;
        let isDrawing = false;
        let shouldStop = false;
        let previousDuration = 3;

        // Auto Sync Logic (Skip Animation & Duration)
        skipAnimationCheck.addEventListener('change', () => {
            if (skipAnimationCheck.checked) {
                if (parseFloat(animDurationInput.value) > 0) {
                    previousDuration = animDurationInput.value;
                }
                animDurationInput.value = 0;
            } else {
                animDurationInput.value = previousDuration > 0 ? previousDuration : 3;
            }
        });

        animDurationInput.addEventListener('input', () => {
            const val = parseFloat(animDurationInput.value);
            if (val === 0) {
                skipAnimationCheck.checked = true;
            } else {
                skipAnimationCheck.checked = false;
                if (!isNaN(val) && val > 0) {
                    previousDuration = val;
                }
            }
        });

        let audioCtx = null;
        let lastWinner = null;

        function getNumbers() {
            const raw = numInput.value.trim();
            if (!raw) return [];
            return raw.split(/[\s,]+/).map(v => v.trim()).filter(Boolean);
        }

        function syncCount() {
            totalCountInput.value = getNumbers().length;
        }

        function toast(message) {
            const el = document.getElementById('toast');
            el.textContent = message;
            el.classList.add('show');
            clearTimeout(toast._timer);
            toast._timer = setTimeout(() => el.classList.remove('show'), 1800);
        }

        function beep(frequency=620, duration=.08, type='sine') {
            try {
                audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.value = frequency;
                gain.gain.setValueAtTime(.0001, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(.055, audioCtx.currentTime + .01);
                gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration + .02);
            } catch (_) {}
        }

        function winSound() {
            beep(740,.09,'triangle');
            setTimeout(() => beep(988,.12,'triangle'), 90);
        }

        function generateRandomRange() {
            const from = parseInt(rangeFromInput.value, 10);
            const to = parseInt(rangeToInput.value, 10);

            if (!Number.isInteger(from) || !Number.isInteger(to)) {
                alert("ကျေးဇူးပြု၍ စမည့်နံပါတ်နှင့် ဆုံးမည့်နံပါတ်များကို မှန်ကန်စွာ ထည့်ပါ။");
                return;
            }
            if (from > to) {
                alert("စမည့်နံပါတ်သည် ဆုံးမည့်နံပါတ်ထက် မကြီးရပါ။");
                return;
            }

            const arr = Array.from({length: to - from + 1}, (_, i) => from + i);
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            numInput.value = arr.join(' ');
            syncCount();
            displayBox.textContent = 'အဆင်သင့်';
            toast(`${arr.length} ခု ထုတ်ပြီးပါပြီ`);
            beep(520,.07);
        }

        numInput.addEventListener('input', syncCount);

        totalCountInput.addEventListener('input', () => {
            const count = parseInt(totalCountInput.value, 10);
            if (Number.isInteger(count) && count >= 0) {
                numInput.value = Array.from({length: count}, (_, i) => i + 1).join(' ');
            } else if (totalCountInput.value === '') {
                numInput.value = '';
            }
        });

        skipAnimationCheck.addEventListener('change', () => {
            if (skipAnimationCheck.checked) {
                const current = parseFloat(animDurationInput.value);
                if (Number.isFinite(current) && current > 0) previousDuration = current;
                animDurationInput.value = 0;
            } else {
                animDurationInput.value = previousDuration > 0 ? previousDuration : 3;
            }
        });

        animDurationInput.addEventListener('input', () => {
            const val = parseFloat(animDurationInput.value);
            if (val === 0) {
                skipAnimationCheck.checked = true;
            } else {
                skipAnimationCheck.checked = false;
                if (Number.isFinite(val) && val > 0) previousDuration = val;
            }
        });

        function setControlsDisabled(disabled) {
            [drawAmountInput, animDurationInput, skipAnimationCheck, totalCountInput,
             rangeFromInput, rangeToInput, numInput].forEach(el => el.disabled = disabled);
        }

        async function startBatchDraw() {
            if (isDrawing) return;

            const amount = parseInt(drawAmountInput.value, 10);
            const numbers = getNumbers();

            if (!numbers.length) {
                alert("ကျေးဇူးပြု၍ မဲစာရင်း ထည့်ပါ သို့မဟုတ် စုစုပေါင်း အရေအတွက် ထည့်ပါ။");
                return;
            }
            if (!Number.isInteger(amount) || amount < 1) {
                alert("ကျေးဇူးပြု၍ မှန်ကန်သော မဲအရေအတွက် (အနည်းဆုံး ၁ ခု) ထည့်ပါ။");
                return;
            }
            if (amount > numbers.length) {
                alert(`မဲနှိုက်မည့် အရေအတွက်သည် စုစုပေါင်း မဲအရေအတွက်ထက် မများရပါ။ (လက်ရှိမဲ: ${numbers.length} ခု)`);
                return;
            }

            // Unlock browser audio only after a user gesture.
            try {
                audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') await audioCtx.resume();
            } catch (_) {}

            isDrawing = true;
            shouldStop = false;
            drawBtn.style.display = "none";
            stopBtn.style.display = "flex";
            setControlsDisabled(true);

            for (let i = 0; i < amount; i++) {
                if (shouldStop) break;
                await runSingleDraw(i + 1, amount);
                if (shouldStop) break;
                if (i < amount - 1) {
                    await new Promise(resolve => setTimeout(resolve, skipAnimationCheck.checked ? 100 : 260));
                }
            }

            if (!shouldStop && amount > 1) {
                displayBox.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                        <span style="font-size:clamp(16px,3.5vw,22px);color:#2ecc71;">🎉 မဲနှိုက်မှု ပြီးစီးပါပြီ!</span>
                        <span style="font-size:clamp(11px,2vw,14px);color:#f1c40f;font-weight:normal;">
                            မဲပေါက်သူ စုစုပေါင်း ${amount} ဦး ရွေးချယ်ပြီးပါပြီ
                        </span>
                    </div>`;
                winSound();
            } else if (shouldStop) {
                displayBox.innerHTML = `<span style="font-size:16px;color:#f1c40f;">🛑 မဲနှိုက်မှု ရပ်တန့်ထားပါသည်</span>`;
            }

            isDrawing = false;
            drawBtn.style.display = "flex";
            stopBtn.style.display = "none";
            setControlsDisabled(false);
            shouldStop = false;
        }

        function runSingleDraw(currentIndex, totalAmount) {
            return new Promise(resolve => {
                const numbers = getNumbers();
                if (!numbers.length) return resolve();

                let durationSec = parseFloat(animDurationInput.value);
                if (!Number.isFinite(durationSec) || durationSec < 0) durationSec = 0;

                const finish = () => {
                    if (!numbers.length) return resolve();

                    const winnerIndex = Math.floor(Math.random() * numbers.length);
                    const selectedWinner = numbers[winnerIndex];

                    displayBox.classList.remove('pop-anim');
                    void displayBox.offsetWidth;
                    displayBox.classList.add('pop-anim');

                    showDrawValue(selectedWinner, currentIndex, totalAmount, false);
                    addWinnerToBottomPanel(selectedWinner);
                    lastWinner = selectedWinner;
                    winSound();

                    if (removeWinnerCheckbox.checked) {
                        numbers.splice(winnerIndex, 1);
                        numInput.value = numbers.join(' ');
                        syncCount();
                    }
                    resolve();
                };

                if (skipAnimationCheck.checked || durationSec === 0) {
                    finish();
                    return;
                }

                displayBox.classList.add('shuffling');
                const speed = 50;
                const steps = Math.max(1, Math.ceil((durationSec * 1000) / speed));
                let counter = 0;

                const timer = setInterval(() => {
                    if (shouldStop) {
                        clearInterval(timer);
                        displayBox.classList.remove('shuffling');
                        resolve();
                        return;
                    }

                    const temp = numbers[Math.floor(Math.random() * numbers.length)];
                    showDrawValue(temp, currentIndex, totalAmount, true);
                    beep(280 + (counter % 5) * 35, .025);
                    counter++;

                    if (counter >= steps) {
                        clearInterval(timer);
                        displayBox.classList.remove('shuffling');
                        finish();
                    }
                }, speed);
            });
        }

        function showDrawValue(value, currentIndex, totalAmount, shuffling) {
            if (totalAmount > 1) {
                displayBox.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:center;">
                        <span style="font-size:clamp(10px,1.8vw,12px);color:${shuffling ? '#ff6b6b' : '#aaa'};font-weight:normal;margin-bottom:-2px;">
                            ${shuffling ? 'မဲနှိုက်နေသည်' : 'မဲပေါက်သူ'} (${currentIndex}/${totalAmount})
                        </span>
                        <span>${escapeHtml(value)}</span>
                    </div>`;
            } else {
                displayBox.textContent = value;
            }
        }

        function escapeHtml(value) {
            const div = document.createElement('div');
            div.textContent = String(value);
            return div.innerHTML;
        }

        function stopBatchDraw() {
            shouldStop = true;
        }

        function addWinnerToBottomPanel(winner) {
            winnerCount++;
            winnerTotalCount.textContent = winnerCount;

            document.getElementById('emptyState')?.remove();

            const item = document.createElement('div');
            item.className = 'winner-item';

            const title = document.createElement('span');
            title.className = 'winner-title';
            title.textContent = `🏆 ${winner}`;

            const number = document.createElement('span');
            number.className = 'winner-number';
            number.textContent = `မဲအကြိမ် #${winnerCount}`;

            item.append(title, number);
            winnerList.insertBefore(item, winnerList.firstChild);
        }

        function getWinnerValues() {
            return [...winnerList.querySelectorAll('.winner-title')].map(el =>
                el.textContent.replace(/^🏆\s*/, '').trim()
            );
        }

        async function copyWinners() {
            const winners = getWinnerValues();
            if (!winners.length) {
                toast('မဲပေါက်သူ မရှိသေးပါ');
                return;
            }
            try {
                await navigator.clipboard.writeText(winners.join('\n'));
                toast('Winner list copied ✓');
            } catch (_) {
                const ta = document.createElement('textarea');
                ta.value = winners.join('\n');
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                toast('Winner list copied ✓');
            }
        }

        function downloadWinners(type) {
            const winners = getWinnerValues();
            if (!winners.length) {
                toast('Download လုပ်ရန် winner မရှိသေးပါ');
                return;
            }

            let content, mime, filename;
            if (type === 'csv') {
                content = '\uFEFF' + 'No,Winner\n' +
                    winners.map((w, i) => `${i + 1},"${String(w).replaceAll('"','""')}"`).join('\n');
                mime = 'text/csv;charset=utf-8';
                filename = 'lucky-draw-winners.csv';
            } else {
                content = winners.map((w, i) => `${i + 1}. ${w}`).join('\n');
                mime = 'text/plain;charset=utf-8';
                filename = 'lucky-draw-winners.txt';
            }

            const blob = new Blob([content], {type:mime});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 500);
            toast(`${type.toUpperCase()} saved ✓`);
        }

        function resetWinners() {
            if (isDrawing) {
                alert("မဲနှိုက်နေစဉ် စာရင်းဖျက်၍ မရပါ။");
                return;
            }
            if (!winnerCount) return;
            if (confirm("မဲပေါက်သူများ စာရင်းအားလုံးကို ဖျက်ရန် သေချာပါသလား?")) {
                winnerList.innerHTML = '<div class="empty-state" id="emptyState">🏆 မဲပေါက်သူ မရှိသေးပါ</div>';
                winnerCount = 0;
                winnerTotalCount.textContent = '0';
                lastWinner = null;
                displayBox.textContent = 'အဆင်သင့်';
                toast('Winner list cleared');
            }
        }

        function clearAllData() {
            if (isDrawing) return alert("မဲနှိုက်နေစဉ် Reset မလုပ်နိုင်ပါ။");
            if (!confirm("မဲစာရင်း၊ မဲပေါက်သူစာရင်းနှင့် Display အားလုံးကို Reset လုပ်မလား?")) return;
            numInput.value = '';
            totalCountInput.value = '';
            drawAmountInput.value = 1;
            displayBox.textContent = 'အဆင်သင့်';
            winnerList.innerHTML = '<div class="empty-state" id="emptyState">🏆 မဲပေါက်သူ မရှိသေးပါ</div>';
            winnerCount = 0;
            winnerTotalCount.textContent = '0';
            lastWinner = null;
            toast('System reset ✓');
        }

        async function toggleFullscreen() {
            const container = document.querySelector('.container');
            if (!document.fullscreenElement) {
                try { await container.requestFullscreen(); }
                catch (_) { container.classList.add('fullscreen-mode'); }
            } else {
                try { await document.exitFullscreen(); } catch (_) {}
            }
        }

        document.addEventListener('fullscreenchange', () => {
            const container = document.querySelector('.container');
            container.classList.toggle('fullscreen-mode', !!document.fullscreenElement);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            const tag = document.activeElement?.tagName;
            const typing = ['INPUT','TEXTAREA'].includes(tag);

            if (e.key === 'Escape' && isDrawing) {
                e.preventDefault();
                stopBatchDraw();
            }

            if (!typing && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                if (!isDrawing) startBatchDraw();
            }

            if (!typing && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                toggleFullscreen();
            }
        });

        // Initial state
        syncCount();
