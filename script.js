// Elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const completedList = document.getElementById('completedList');
const pendingEmpty = document.getElementById('pending-empty');
const completedEmpty = document.getElementById('completed-empty');

// Simple in-memory store with localStorage persistence
let tasks = [];
const STORAGE_KEY = 'todo.tasks.v1';

function saveTasks(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks(){
    try{
        const raw = localStorage.getItem(STORAGE_KEY);
        tasks = raw ? JSON.parse(raw) : [];
    }catch(e){ tasks = [] }
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

function render(){
    taskList.innerHTML = '';
    completedList.innerHTML = '';

    const pending = tasks.filter(t=>!t.completed);
    const done = tasks.filter(t=>t.completed);

    if(pending.length===0) pendingEmpty.style.display='block'; else pendingEmpty.style.display='none';
    if(done.length===0) completedEmpty.style.display='block'; else completedEmpty.style.display='none';

    pending.forEach(t=>{ taskList.appendChild(createTaskElement(t)) });
    done.forEach(t=>{ completedList.appendChild(createTaskElement(t)) });
}

function createTaskElement(task){
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    const left = document.createElement('div'); left.className = 'task-left';

    const check = document.createElement('button');
    check.className = 'check-btn';
    check.type = 'button';
    check.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark as completed');
    check.dataset.checked = task.completed ? 'true' : 'false';
    check.innerHTML = task.completed ? '&#10003;' : '';

    const span = document.createElement('div');
    span.className = 'task-text' + (task.completed? ' completed':'');
    span.textContent = task.text;

    left.appendChild(check); left.appendChild(span);

    const actions = document.createElement('div'); actions.className = 'task-actions';
    const del = document.createElement('button'); del.className = 'icon-btn delete'; del.type='button'; del.setAttribute('aria-label','Delete task');
    del.innerHTML = '✕';
    actions.appendChild(del);

    li.appendChild(left); li.appendChild(actions);

    // small add animation
    li.style.opacity = 0; li.style.transform = 'translateY(6px)';
    requestAnimationFrame(()=>{ li.style.transition='all 220ms ease'; li.style.opacity=1; li.style.transform='translateY(0)'; });

    // events
    check.addEventListener('click', ()=>{
        task.completed = !task.completed;
        saveTasks(); render();
    });
    del.addEventListener('click', ()=>{
        tasks = tasks.filter(t=>t.id!==task.id);
        saveTasks(); render();
    });

    return li;
}

function addTask(text){
    const trimmed = text.trim();
    if(!trimmed) return;
    const newTask = { id: uid(), text: trimmed, completed:false };
    tasks.unshift(newTask);
    saveTasks(); render();
}

// init
loadTasks(); render();

// form submit
taskForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = taskInput.value;
    if(!val.trim()){
        taskInput.focus();
        return;
    }
    addTask(val);
    taskInput.value='';
    taskInput.focus();
});

// keyboard: add on Enter inside input is handled by form submit

// expose for debugging (optional)
window.__TODO__ = {get:()=>tasks};

/* Snowfall animation (decorative) */
(function(){
    const canvas = document.getElementById('snow-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let width = 0, height = 0, dpr = 1;
    let running = true;

    function rand(min, max){ return Math.random() * (max - min) + min }

    function resize(){
        dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.max(1, Math.floor(width * dpr));
        canvas.height = Math.max(1, Math.floor(height * dpr));
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // number of flakes scales with area, capped for perf
        const area = width * height;
        const targetCount = Math.min(300, Math.floor(area / 1500));
        // add or remove particles to match target
        while(particles.length < targetCount) particles.push(createParticle());
        while(particles.length > targetCount) particles.pop();
    }

    function createParticle(){
        const size = rand(1, 4) * (Math.random() < 0.2 ? 1.8 : 1);
        return {
            x: rand(0, width),
            y: rand(-height, 0),
            r: size,
            speed: rand(0.3, 1.2) * (size/2),
            sway: rand(0.5, 1.8),
            angle: rand(0, Math.PI*2),
            alpha: rand(0.4, 0.95)
        };
    }

    function update(dt){
        for(let p of particles){
            p.y += p.speed * dt * 0.06;
            p.angle += 0.01 * p.sway * dt * 0.06;
            p.x += Math.sin(p.angle) * (0.5 + p.sway*0.2);
            if(p.y - p.r > height || p.x < -50 || p.x > width + 50){
                // recycle to top
                p.x = rand(0, width);
                p.y = rand(-60, -10);
                p.speed = rand(0.3, 1.2) * (p.r/2);
                p.alpha = rand(0.4, 0.95);
            }
        }
    }

    function draw(){
        ctx.clearRect(0,0,width,height);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for(let p of particles){
            ctx.globalAlpha = p.alpha * 0.95;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    let last = performance.now();
    function frame(now){
        if(!running) return;
        const dt = Math.min(60, now - last);
        last = now;
        update(dt);
        draw();
        requestAnimationFrame(frame);
    }

    // Pause when page isn't visible
    document.addEventListener('visibilitychange', ()=>{ running = !document.hidden; if(running){ last = performance.now(); requestAnimationFrame(frame) } });

    window.addEventListener('resize', resize);
    resize();
    last = performance.now();
    requestAnimationFrame(frame);
})();
