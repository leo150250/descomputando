const olListaThreads = document.getElementById("listaThreads");
const divMapaExecucao = document.getElementById("mapaExecucao");

var threads = [];
var proximoId = 32000;
var metodoFila = "fifo";

var quantums = [];
var quantumId = 0;
var quantumValor = 50;

var timerExecucao = null;

var cor = 0;

function clamp(num, min, max) {
	return num < min ? min : num > max ? max : num;
}

class Thread {
	constructor(_trabalho, _prioridade = 0) {
		this.id = obterProximoId();
		this.cor = obterProximaCor();
		this.trabalhoInicio = _trabalho;
		this.trabalho = this.trabalhoInicio;
		this.prioridade = _prioridade;
		this.quantumGerado = 0;

		this.el = document.createElement("li");
		this.el.classList.add("tag");
		this.el.style.backgroundColor = this.cor;
		this.elNome = document.createElement("p");
		this.elNome.innerText = `#${this.id}`;
		this.elNome.style = "float: left";
		this.el.appendChild(this.elNome);
		this.elTrabalho = document.createElement("p");
		this.elTrabalho.style = "float: right";
		this.el.appendChild(this.elTrabalho);
		this.elProgresso = document.createElement("progress");
		this.el.appendChild(this.elProgresso);
		this.elProgresso.max = this.trabalhoInicio;
		this.atualizarElemento();

		threads.push(this);
		console.log(`Thread #${this.id} criada.`);
	}
	destruirThread() {
		olListaThreads.removeChild(this.el);
		let indice = threads.findIndex(thread => thread.id === this.id);
		if (indice !== -1) {
			threads.splice(indice,1);
		} else {
			console.log($`A thread #${this.id} não foi encontrada para remoção da array principal.`);
		}
	}
	atualizarElemento() {
		this.elTrabalho.innerText = this.trabalho;
		this.elProgresso.value = this.trabalhoInicio - this.trabalho;
	}
	executar() {
		this.trabalho--;
		if (this.trabalho == 0) {
			this.trabalho = 0;
		}
		this.atualizarElemento();
	}
	criarQuantum(_threadAnterior = this) {
		if (this.quantumGerado < this.trabalhoInicio) {
			if (_threadAnterior !== this) {
				new Quantum(null, 25);
			}
			let novoQuantum = new Quantum(this, clamp(this.trabalhoInicio - this.quantumGerado, 0, quantumValor));
			this.quantumGerado += novoQuantum.valor;
			return true;
		} else {
			return false;
		}
	}
}

class Quantum {
	constructor(_thread = null, _valor = null) {
		this.thread = _thread;
		this.cor = "#888";
		this.valor = _valor;
		if (this.thread !== null) {
			this.cor = this.thread.cor;
		}
		if (this.valor === null) {
			this.valor = quantumValor;
		}

		this.el = document.createElement("div");
		this.el.classList.add("tag");
		this.el.classList.add("inline");
		this.el.style.width = this.valor + "px";
		this.el.innerText = this.valor;
		this.el.style.backgroundColor = this.cor;

		quantums.push(this);
		divMapaExecucao.appendChild(this.el);
	}
	executar() {
		this.valor--;
		if (this.valor == 0) {
			this.valor = 0;
			quantumId++;
		}
		this.atualizarElemento();
		if (this.thread !== null) {
			this.thread.executar();
		}
	}
	atualizarElemento() {
		this.el.innerText = this.valor;
		if (this.valor == 0) {
			this.el.style.backgroundColor = "#0002";
		}
	}
}

function obterProximoId() {
	let novoId = proximoId;
	proximoId++;
	return novoId;
}

function obterProximaCor() {
	let corAtual = cor;
	cor = (cor + 62) % 360;

	const hueParaRgb = (p, q, t) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	const h = corAtual / 360;
	const s = 0.9;
	const l = 0.7;
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const paraHex = valor => Math.round(valor * 255).toString(16).padStart(2, "0");

	const r = hueParaRgb(p, q, h + 1 / 3);
	const g = hueParaRgb(p, q, h);
	const b = hueParaRgb(p, q, h - 1 / 3);

	return `#${paraHex(r)}${paraHex(g)}${paraHex(b)}`;
}

function criarThreadsAleatorias() {
	for (let i = 0; i < 5; i++) {
		criarNovoThread();
	}
}
function criarNovoThread(_trabalho = null, _prioridade = 0) {
	let valorTrabalho = 0;
	if (_trabalho === null) {
		valorTrabalho = 100 + (Math.round(Math.random() * 50) * 10);
	}
	new Thread(valorTrabalho, _prioridade);
}

function ordenarThreads() {
	olListaThreads.innerHTML = "";
	for (let i = 0; i < threads.length; i++) {
		threads[i].trabalho = this.trabalhoInicio;
		threads[i].quantumGerado = 0;
	}
	let listaThreads = threads;
	switch (metodoFila) {
		case "fifo":
		case "rr":
		case "sjf":
			threads = listaThreads;
			for (let i = 0; i < threads.length; i++) {
				olListaThreads.appendChild(threads[i].el);
			}
			break;
	}
}

function gerarQuantums() {
	quantums = [];
	quantumId = 0;
	divMapaExecucao.innerHTML = "";
	switch (metodoFila) {
		case "fifo":
			threads.forEach(thread => {
				while (thread.criarQuantum()) {
					//Vai fazendo enquanto cria
				}
				new Quantum(null, 25);
			})
			break;
		case "rr":
			let fazendoQuantum = true;
			let threadAnterior = 0;
			while (fazendoQuantum) {
				fazendoQuantum = false;
				for (let i = 0; i < threads.length; i++) {
					let criou = threads[i].criarQuantum(threads[threadAnterior]);
					if (criou) {
						threadAnterior = i;
						fazendoQuantum = true;
					}
				}
			}
			break;
	}
}

function prepararExecucao(_modo = null) {
	if (_modo !== null) {
		metodoFila = _modo;
	}
	ordenarThreads();
	gerarQuantums();
}

function executar() {
	if (quantumId < quantums.length) {
		quantums[quantumId].executar();
	} else {
		clearInterval(timerExecucao);
	}
}
function iniciarExecucao() {
	timerExecucao = setInterval(executar,10);
}

criarThreadsAleatorias();
prepararExecucao();