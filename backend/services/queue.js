const EventEmitter = require('events');

class ConversionQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency || 3; // max 3 simultaneous conversions
    this.queue = [];
    this.running = 0;
  }

  add(jobFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ jobFn, resolve, reject });
      this.process();
    });
  }

  process() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;

    const { jobFn, resolve, reject } = this.queue.shift();
    this.running++;

    Promise.resolve()
      .then(() => jobFn())
      .then(result => {
        this.running--;
        resolve(result);
        this.process(); // process next
      })
      .catch(err => {
        this.running--;
        reject(err);
        this.process();
      });
  }

  get size() { return this.queue.length; }
  get active() { return this.running; }
}

// Singleton queue instance
const conversionQueue = new ConversionQueue({ concurrency: 3 });
module.exports = conversionQueue;
