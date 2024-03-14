import { fromEvent, interval } from 'rxjs';
import { map, mergeMap, takeUntil, delay, retry, retryWhen, delayWhen, timer, take } from 'rxjs';

function createHash() {
    return Date.now();
}

// Função para criar uma mensagem com um hash estático
const createMessage = (message, payload) => ({
    event: message,
    payload: payload
});

// Função para enviar a mensagem ao servidor
const sendMessage = (message, payload, hash) => {
    payload.hash = hash;
    const event = new CustomEvent("room-event", {
        detail: createMessage(message, payload)
    });
    document.dispatchEvent(event);
};

// Função para simular o recebimento do ack
const receiveAck = (hash) => new Promise(resolve => {
    window.addEventListener(`phx:ack`, (event) => {
    console.log("from rcv ack!!")
    console.log(event)
    if (event.detail.hash === hash) {
        resolve();
    }
    });
});

// Função para lidar com o envio de mensagens com backoff
// const sendMessageWithBackoff = (message, payload, hash) => {
//     return interval(1000) // Intervalo inicial de 1 segundo
//     .pipe(
//         map(() => ({ message, payload, hash })),
//         mergeMap(({ message, payload, hash }) => {
//         sendMessage(message, payload, hash);
//         return fromEvent(window, `phx:ack`).pipe(
//             map(event => event.detail.hash),
//             takeUntil(receiveAck(hash))
//         );
//         }),
//         retry(3) // Backoff incremental
//     );
// };
function sendMessageWithBackoff(message, payload, hash) {
    return interval(1000).pipe(
        take(1),
        map(() => ({ message, payload, hash })),
        mergeMap(({ message, payload, hash }) => {
            sendMessage(message, payload, hash);
            return fromEvent(window, `phx:ack`).pipe(
                map(event => {
                    console.log("from event!!")
                    console.log(event)
                    event.detail.hash
                }),
                filter(hash => hash === hashEmUso),
                takeUntil(receiveAck(hashEmUso))
            );
        }),
        retryWhen(err => {
            return err.pipe(
                delayWhen(() => timer(1000)),
                take(4)
            );
        })
    ).subscribe({
        next: (value) => console.log(value), // Handle successful completion (optional)
        error: err => {
            if (err.retryCount === 2) {
                console.error('Limite de tentativas atingido.');
            } else {
                throw err;
            }
        },
        complete: () => console.log('Completed'), // Handle completion after retries (optional)
    });
}

// Exemplo de uso
// sendMessageWithBackoff('hello', { hello: 'world' }, createHash()).subscribe({
//     next: () => console.log('Mensagem enviada com sucesso e ack recebido!'),
//     error: (err) => console.error('Erro ao enviar mensagem:', err)
// });
const hashEmUso = createHash();
sendMessageWithBackoff('hello', { hello: 'world' }, hashEmUso);