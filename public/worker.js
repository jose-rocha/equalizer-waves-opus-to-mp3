postMessage('Primeira Mensagem do Worker');

onmessage = (event) => {
  console.log(`Recebendo a mensagem da página no  worker: ${event.data}`);
  // Process the received data
  const result = event.data * 2; // Example processing
  postMessage(`Processando o resultado: ${result}`);
};
