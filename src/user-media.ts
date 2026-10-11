/**
 * The browser's own camera button, as a DOM element the extension can place.
 *
 * Chrome 151 ships `<usermedia>`: a capability element that owns the whole handover. The page puts
 * a button inside it, the browser draws the prompt, and the element answers with a `MediaStream`.
 * The element will not open the prompt without a real click on that button, so the operator's
 * intent is the browser's to collect -- this module only puts the element where it can be clicked.
 *
 * Camera Source uses it where no host can: a `.sb3` opened in the TurboWarp Editor runs in
 * TurboWarp's document, so there is nobody above the project to place the element. A packaged work
 * has such a host, and there this path stays out of the way -- the extension joins the stream the
 * host already adopted instead of asking again.
 */

export type UserMediaOutcome =
  | Readonly<{kind: 'stream'; stream: MediaStream}>
  | Readonly<{kind: 'cancelled'}>
  | Readonly<{kind: 'error'; code: string; message: string}>;

export interface UserMediaRequest {
  /** Removes the element. A request still waiting settles as `cancelled`. */
  dismiss(): void;
  readonly settled: Promise<UserMediaOutcome>;
}

interface UserMediaElement extends HTMLElement {
  stream?: MediaStream | null;
  setConstraints?: (constraints: unknown) => void;
}

export interface UserMediaRequestOptions {
  document: Document;
  container: Element;
  label: string;
  constraints?: unknown;
}

/** Whether this browser has the capability element at all. */
export function supportsUserMediaElement(view: object = globalThis): boolean {
  return 'HTMLUserMediaElement' in view;
}

/**
 * Places `<usermedia>` in `container` and resolves once the operator has answered.
 *
 * No styling is applied beyond taking the element out of the document flow: the element enforces
 * its own contrast and size rules, and a stylesheet fighting them is how a prompt stops opening.
 */
export function requestUserMedia(options: UserMediaRequestOptions): UserMediaRequest {
  const element = options.document.createElement('usermedia') as UserMediaElement;
  const button = options.document.createElement('button');
  button.type = 'button';
  button.textContent = options.label;
  element.append(button);
  element.style.position = 'absolute';
  element.style.left = '50%';
  element.style.top = '50%';
  element.style.transform = 'translate(-50%, -50%)';
  element.style.zIndex = '2';
  try {
    element.setConstraints?.({video: {}});
  } catch {
    // A browser that has the element but refuses these constraints still answers its own prompt.
  }

  let settle: (outcome: UserMediaOutcome) => void = () => {};
  const settled = new Promise<UserMediaOutcome>((resolve) => {
    settle = resolve;
  });
  let done = false;
  const finish = (outcome: UserMediaOutcome): void => {
    if (done) return;
    done = true;
    element.remove();
    settle(outcome);
  };

  element.addEventListener('stream', () => {
    const stream = element.stream;
    if (stream && typeof stream.getTracks === 'function') finish({kind: 'stream', stream});
    else finish({kind: 'error', code: 'usermedia-empty', message: 'The camera button returned no stream.'});
  });
  element.addEventListener('cancel', () => finish({kind: 'cancelled'}));
  element.addEventListener('error', (event: Event) => {
    const detail = (event as Event & {error?: {name?: unknown; message?: unknown}}).error;
    const code = typeof detail?.name === 'string' && detail.name.length > 0 ? detail.name : 'usermedia-error';
    const message =
      typeof detail?.message === 'string' && detail.message.length > 0
        ? detail.message
        : 'The camera button could not open the camera.';
    finish({kind: 'error', code, message});
  });

  options.container.append(element);
  return Object.freeze({
    dismiss: () => finish({kind: 'cancelled'}),
    settled
  });
}
