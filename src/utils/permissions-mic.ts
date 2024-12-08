import { Dialog } from 'quasar';

export default async function verificarPermissaoMicrofone() {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    return Promise.reject(new Error('A a API mediaDevices ou getUserMedia não é suportada neste navegador.'));
  }

  return navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((response) => response)
    .catch((error) => {
      console.error('Permissão negada', error);
      if (String(error).includes('dismissed')) {
        Dialog.create({
          title: 'Alerta',
          message: 'Você fechou o pedido de permissão para acessar o microfone.',
        });
      } else if (String(error).includes('Permission denied')) {
        Dialog.create({
          title: 'Alerta',
          message: 'Permissão negada para acessar o microfone.',
        });
      }

      return error;
      /*
        se clicar no X sem acietar ou negar vai retorna essa msg
        NotAllowedError: Permission dismissed
     */
    });
}
