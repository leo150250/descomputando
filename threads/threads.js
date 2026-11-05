const olListaThreads = document.getElementById("listaThreads");
const divMapaExecucao = document.getElementById("mapaExecucao");
const divIconeStatus = document.getElementById("iconeStatus");
const buttonAlternarExecucao = document.getElementById("alternarExecucao");
const selectFormaProcessamento = document.getElementById("formaProcessamento");

var threads = [];
var proximoId = 32000;
var metodoFila = "fifo";
var threadEmExecucao = null;

var quantums = [];
var quantumId = null;
var quantumValor = 20;
var quantumContexto = 5;

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
		this.quantums = [];
		this.status = "🆕";

		this.el = document.createElement("li");
		this.el.classList.add("tag");
		this.el.style.backgroundColor = this.cor;
		this.elNome = document.createElement("p");
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
		this.elNome.innerText = `#${this.id} ${this.status}`;
		this.elTrabalho.innerText = this.trabalho;
		this.elProgresso.value = this.trabalhoInicio - this.trabalho;
	}
	executar() {
		if (threadEmExecucao !== null) {
			if (threads[threadEmExecucao] !== this) {
				if (threads[threadEmExecucao].trabalho !== 0) {
					threads[threadEmExecucao].status = "💤";
				} else {
					threads[threadEmExecucao].status = "✅";
				}
				threads[threadEmExecucao].atualizarElemento();
			}
		}
		this.status = "▶️";
		threadEmExecucao = threads.findIndex(thread => thread.id === this.id);
		this.trabalho--;
		if (this.trabalho <= 0) {
			this.status = "✅";
			this.trabalho = 0;
		}
		this.atualizarElemento();
	}
	criarQuantum(_threadAnterior = this) {
		if (this.quantumGerado < this.trabalhoInicio) {
			let novoQuantum = new Quantum(this, clamp(this.trabalhoInicio - this.quantumGerado, 0, quantumValor));
			this.quantumGerado += novoQuantum.valor;
			this.quantums.push(novoQuantum);
			return [true,novoQuantum];
		} else {
			return [false];
		}
	}
	resetar() {
		this.status = "🆕";
		this.trabalho = this.trabalhoInicio;
		this.quantumGerado = 0;
		this.atualizarElemento();
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
		} else {
			if (threadEmExecucao !== null) {
				if (threads[threadEmExecucao].trabalho !== 0) {
					threads[threadEmExecucao].status = "💤";
				} else {
					threads[threadEmExecucao].status = "✅";
				}
				threads[threadEmExecucao].atualizarElemento();
				threadEmExecucao = null;
			}
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
		criarNovoThread(null, 0, false);
	}
}
function criarNovoThread(_trabalho = null, _prioridade = 0, _prepararExec = true) {
	let valorTrabalho = 0;
	if (_trabalho === null) {
		valorTrabalho = quantumValor + (Math.round(Math.random() * 50));
	} else {
		valorTrabalho = _trabalho;
	}
	let novaThread = new Thread(valorTrabalho, _prioridade);
	if (quantumId !== null) {
		let novosQuantums = [];
		let quantumOk = false;
		while (!quantumOk) {
			let novoQuantum = novaThread.criarQuantum();
			quantumOk = !novoQuantum[0];
			if (novoQuantum[0]) {
				novosQuantums.push(novoQuantum[1]);
			}
		}

		if (metodoFila === "srtf") {
			console.log("Em SRTF");
			console.log(threads);
			console.log(quantums);
			let threadAtual = quantums[quantumId] ? quantums[quantumId].thread : null;
			if (threadAtual === null) {
				console.log(`Não há thread em execução. Deve ser quantum de troca de contexto.`);
				console.log(quantums[quantumId]);
				threadAtual = quantums[quantumId+1].thread;
			}
			let indiceThread = threads.indexOf(threadAtual);
			let indiceNovaThread = threads.indexOf(novaThread);
			console.log(`Thread para analisar: ${indiceThread}`);
			console.log(`Trabalho da thread nova: ${novaThread.trabalhoInicio}`);
			console.log(`Trabalho da thread para analisar: ${threadAtual.trabalho}`);
			if (novaThread.trabalhoInicio < threadAtual.trabalho) {
				console.log("Inserir preemptivamente entre quantums");
			} else {
				console.log("Inserir antes da próxima menor thread ou no fim da fila");
				let indiceMenorThread = indiceNovaThread;
				for (let i = indiceThread + 1; i < threads.length; i++) {
					console.log(`Trabalho de i: ${threads[i].trabalho}`);
					if (novaThread.trabalho < threads[i].trabalho) {
						console.log(`Achei menor trabalho!`);
						indiceMenorThread = i;
						break;
					}
				}
				console.log(`Menor thread: ${indiceMenorThread}`);
				if (indiceMenorThread != indiceNovaThread) {
					for (let i = 0; i < novosQuantums.length; i++) {
						quantums.splice(quantums.indexOf(threads[indiceMenorThread].quantums[0]),0,novosQuantums[i]);
						quantums.pop();
					}
					olListaThreads.insertBefore(novaThread.el,threads[indiceMenorThread].el);
					threads.splice(indiceMenorThread,0,threads.pop());
				} else {
					console.log("Não precisa mudar.");
					olListaThreads.appendChild(novaThread.el);
				}
			}
			/*
			threads.splice(threads.indexOf(novaThread), 1);
			let indiceNova = 0;
			if (atual != null) {
				let indiceAtual = threads.indexOf(atual);
				if (indiceAtual !== -1) {
					if (novaThread.trabalhoInicio < atual.trabalho) {
						indiceNova = indiceAtual + 1;
					} else {
						indiceNova = indiceAtual + 1;
						while (indiceNova < threads.length && threads[indiceNova].trabalhoInicio <= novaThread.trabalhoInicio) {
							indiceNova++;
						}
					}
				}
			} else {
				indiceNova = 0;
			}
			threads.splice(indiceNova, 0, novaThread);
			ordenarThreads();

			let indiceQuantums = quantumId + 1;
			if (atual != null && novaThread.trabalhoInicio >= atual.trabalho) {
				while (indiceQuantums < quantums.length && quantums[indiceQuantums].thread != null && quantums[indiceQuantums].thread.trabalhoInicio <= novaThread.trabalhoInicio) {
					indiceQuantums++;
				}
			}

			quantums.splice(indiceQuantums, 0, ...novosQuantums);
			*/
		} else {
			for (let novoQuantum of novosQuantums) {
				quantums.push(novoQuantum);
			}
		}

		divMapaExecucao.innerHTML = "";
		for (let i = 0; i < quantums.length; i++) {
			divMapaExecucao.appendChild(quantums[i].el);
		}

		adicionarTrocasContexto();
	} else {
		if (_prepararExec) {
			prepararExecucao();
		}
	}
}

function ordenarThreads() {
	olListaThreads.innerHTML = "";
	let listaThreads = threads;
	switch (metodoFila) {
		case "fifo":
		case "rr":
			threads = listaThreads;
			break;
		case "sjf":
		case "srtf":
			threads = listaThreads.sort((a, b) => a.trabalhoInicio - b.trabalhoInicio);
			break;
	}
	for (let i = 0; i < threads.length; i++) {
		olListaThreads.appendChild(threads[i].el);
	}
}

function gerarQuantums(_adicionar = false) {
	if (!_adicionar) {
		quantums = [];
		quantumId = null;
		divMapaExecucao.innerHTML = "";
	}
	let threadAnterior = null;
	switch (metodoFila) {
		case "fifo":
		case "sjf":
			threadAnterior = threads[0];
			threads.forEach(thread => {
				while (thread.criarQuantum(threadAnterior)[0]) {
					threadAnterior = thread;
				}
			});
			break;
		case "srtf":
			threadAnterior = threads[0];
			threads.forEach(thread => {
				while (thread.criarQuantum(threadAnterior)[0]) {
					threadAnterior = thread;
				}
			});
			break;
		case "rr":
			let fazendoQuantum = true;
			threadAnterior = 0;
			while (fazendoQuantum) {
				fazendoQuantum = false;
				for (let i = 0; i < threads.length; i++) {
					let novoQuantum = threads[i].criarQuantum(threads[threadAnterior]);
					if (novoQuantum[0]) {
						threadAnterior = i;
						fazendoQuantum = true;
					}
				}
			}
			break;
	}
	adicionarTrocasContexto();
}

function adicionarTrocasContexto() {
	let houveMudanca = false
	for (let i = 1; i < quantums.length; i++) {
		if ((quantums[i].thread !== quantums[i - 1].thread)
		&& (quantums[i].thread !== null && quantums[i -1].thread !== null)) {
			new Quantum(null, quantumContexto);
			houveMudanca = true;
			let trocaContexto = quantums.pop();
			quantums.splice(i, 0, trocaContexto);
			i++;
		}
	}

	if (houveMudanca) {
		divMapaExecucao.innerHTML = "";
		for (let i = 0; i < quantums.length; i++) {
			divMapaExecucao.appendChild(quantums[i].el);
		}
	}
}

function prepararExecucao(_modo = null) {
	if (_modo !== null) {
		metodoFila = _modo;
	} else {
		metodoFila = selectFormaProcessamento.selectedOptions[0].value;
	}
	for (let i = 0; i < threads.length; i++) {
		threads[i].resetar();
	}
	ordenarThreads();
	gerarQuantums();
}

function executar() {
	if (quantumId === null) {
		quantumId = 0;
	}
	if (quantumId < quantums.length) {
		quantums[quantumId].executar();
	} else {
		pararExecucao();
	}
}
function iniciarExecucao() {
	timerExecucao = setInterval(executar,100);
	for (let i = 0; i < threads.length; i++) {
		threads[i].status = "⏳";
		threads[i].atualizarElemento();
	}
	divIconeStatus.classList.add("ativo");
	buttonAlternarExecucao.innerHTML = "⏸️";
}
function pararExecucao() {
	clearInterval(timerExecucao);
	timerExecucao = null;
	divIconeStatus.classList.remove("ativo");
	buttonAlternarExecucao.innerHTML = "▶️";
}
function alternarExecucao() {
	if (timerExecucao === null) {
		iniciarExecucao();
	} else {
		pararExecucao();
	}
}

criarThreadsAleatorias();
prepararExecucao();