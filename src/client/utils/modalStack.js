import { useEffect, useRef } from 'react';

/**
 * Gerenciador Unificado de Pilha de Modais e Popups (LIFO)
 * 
 * Funcionalidades:
 * 1. Fechamento estritamente ordenado por hierarquia (LIFO - Last In, First Out)
 * 2. Fechamento global via tecla ESC (mesmo com foco em formulários/inputs)
 * 3. Fechamento global via botão Voltar do Celular (Android / Mobile Back Button / Navegador)
 * 4. Sincronização limpa do histórico (não acumula entradas dummy quando fechado via ESC, X ou clique fora)
 */

const stack = [];
let suppressNextPopstate = 0;
let isBackActionInProgress = false;
let globalListenersInitialized = false;

function initGlobalListeners() {
  if (globalListenersInitialized || typeof window === 'undefined') return;
  globalListenersInitialized = true;

  // 1. Listener Global de Tecla Escape (Fase de captura: intercepta antes de qualquer outro handler)
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (stack.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const top = stack[stack.length - 1];
          if (top && typeof top.close === 'function') {
            top.close();
          }
        }
      }
    },
    true
  );

  // 2. Listener Global de Botão Voltar (Mobile Android / Histórico do Navegador)
  window.addEventListener('popstate', () => {
    if (suppressNextPopstate > 0) {
      suppressNextPopstate--;
      return;
    }

    if (stack.length > 0) {
      // O botão voltar do celular já consumiu a entrada de histórico
      isBackActionInProgress = true;
      try {
        const top = stack[stack.length - 1];
        if (top && typeof top.close === 'function') {
          top.close();
        }
      } finally {
        setTimeout(() => {
          isBackActionInProgress = false;
        }, 60);
      }
    }
  });
}

/**
 * Registra um modal aberto na pilha global
 * @param {string} id ID único do modal
 * @param {() => void} closeFn Função para fechar o modal
 * @param {string} name Nome do modal para depuração
 * @returns {() => void} Função de desregistro
 */
export function registerModal(id, closeFn, name = 'modal') {
  initGlobalListeners();

  // Insere uma entrada dummy no histórico para capturar o botão Voltar do celular
  let pushed = false;
  try {
    window.history.pushState({ dbvModalId: id, name }, '');
    pushed = true;
  } catch {}

  const entry = { id, name, close: closeFn, pushedHistory: pushed };
  stack.push(entry);

  return () => {
    unregisterModal(id);
  };
}

/**
 * Desregistra um modal da pilha e limpa o histórico caso não tenha sido acionado pelo botão voltar
 * @param {string} id ID do modal
 */
export function unregisterModal(id) {
  const index = stack.findIndex((m) => m.id === id);
  if (index !== -1) {
    const [entry] = stack.splice(index, 1);
    // Se foi fechado pelo usuário (botão X, ESC, submit, clique fora) e NÃO pelo voltar do celular,
    // revertemos a entrada de histórico dummy
    if (entry.pushedHistory && !isBackActionInProgress) {
      suppressNextPopstate++;
      try {
        window.history.back();
      } catch {
        suppressNextPopstate = Math.max(0, suppressNextPopstate - 1);
      }
    }
  }
}

/**
 * Hook React para registrar automaticamente um modal na pilha de fechamento hierárquico
 * @param {boolean} isOpen Se o modal está aberto
 * @param {() => void} onClose Callback para fechar o modal
 * @param {string} modalName Nome descritivo do modal
 */
export function useModalDismiss(isOpen, onClose, modalName = 'modal') {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const modalId = `${modalName}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const unregister = registerModal(
      modalId,
      () => {
        onCloseRef.current?.();
      },
      modalName
    );

    return () => {
      unregister();
    };
  }, [isOpen, modalName]);
}
