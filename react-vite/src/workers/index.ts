import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    alert('Uma nova versão está disponível! Recarregando...');
    window.location.reload();
  },
  onOfflineReady() {
    alert('App pronto para uso offline!');
  },
});

export default function registerServiceWorker() {
  // Você pode chamar updateSW() se quiser forçar a atualização manualmente
  updateSW();
}