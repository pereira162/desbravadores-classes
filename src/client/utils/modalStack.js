import { useEffect, useRef } from 'react';

/**
 * Gerenciador Unificado de Pilha de Modais e Popups (LIFO)
 *
 * Princípios de Código Limpo:
 * 1. Ponto Único de Controle: Um único listener global no window (fase de captura)
 *    para interceptar ESC de forma consistente em qualquer input, formulário ou componente.
 * 2. Ordem Hierárquica Estrita: O último modal aberto é sempre o primeiro a fechar (LIFO).
 * 3. Suporte Mobile Nativo: Intercepta o botão "Voltar" do navegador/Android (popstate)
 *    fechando o modal em vez de sair da página.
 * 4. Zero Duplicação: Sem listeners manuais repetidos em cada componente.
 */

if (typeof window !== 'undefined') {
  if (!window.__dbvModalStack) {
    window.__dbvModalStack = [];
  }
}

function getStack() {
  if (typeof window !== 'undefined') {
    if (!window.__dbvModalStack) window.__dbvModalStack = [];
    return window.__dbvModalStack;
  }
  return [];
}

let suppressPopstateCount = 0;
let isBackActionInProgress = false;
let globalListenersAttached = false;

function handleGlobalKeyDown(e) {
  const isEsc =
    e.key === 'Escape' ||
    e.key === 'Esc' ||
    e.code === 'Escape' ||
    e.keyCode === 27 ||
    e.which === 27;

  if (!isEsc) return;

  const stack = getStack();
  if (stack.length > 0) {
    e.preventDefault();
    e.stopPropagation();

    // Fecha apenas o modal do topo (o mais recente)
    const top = stack[stack.length - 1];
    if (top && typeof top.close === 'function') {
      top.close();
    }
  }
}

function handleGlobalPopState() {
  if (suppressPopstateCount > 0) {
    suppressPopstateCount--;
    return;
  }

  const stack = getStack();
  if (stack.length > 0) {
    isBackActionInProgress = true;
    try {
      const top = stack[stack.length - 1];
      if (top && typeof top.close === 'function') {
        top.close();
      }
    } finally {
      setTimeout(() => {
        isBackActionInProgress = false;
      }, 50);
    }
  }
}

function ensureGlobalListeners() {
  if (globalListenersAttached || typeof window === 'undefined') return;
  globalListenersAttached = true;

  // Fase de captura (true) garante prioridade absoluta antes de qualquer elemento filho
  window.addEventListener('keydown', handleGlobalKeyDown, true);
  window.addEventListener('popstate', handleGlobalPopState);
}

/**
 * Registra um modal aberto na pilha global
 */
export function registerModal(id, closeFn, name = 'modal') {
  ensureGlobalListeners();

  let pushed = false;
  try {
    window.history.pushState({ dbvModalId: id, name }, '');
    pushed = true;
  } catch {}

  const entry = { id, name, close: closeFn, pushedHistory: pushed };
  const stack = getStack();
  stack.push(entry);

  return () => {
    unregisterModal(id);
  };
}

/**
 * Remove um modal da pilha e desfaz o pushState caso tenha sido fechado por ESC/botão
 */
export function unregisterModal(id) {
  const stack = getStack();
  const index = stack.findIndex((m) => m.id === id);
  if (index !== -1) {
    const [entry] = stack.splice(index, 1);
    if (entry.pushedHistory && !isBackActionInProgress) {
      suppressPopstateCount++;
      try {
        window.history.back();
      } catch {
        suppressPopstateCount = Math.max(0, suppressPopstateCount - 1);
      }
    }
  }
}

/**
 * Hook limpo e declarativo para qualquer modal, popup ou janela
 * @param {boolean} isOpen Se o modal está aberto
 * @param {() => void} onClose Callback chamado para fechar
 * @param {string} modalName Identificador para depuração
 */
export function useModalDismiss(isOpen, onClose, modalName = 'modal') {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const modalId = `${modalName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return registerModal(
      modalId,
      () => {
        onCloseRef.current?.();
      },
      modalName
    );
  }, [isOpen, modalName]);
}
