jest.mock('child_process');
jest.mock('fs');

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Setup mocks before requiring services
const mockExecImplementation = (cmd, callback) => {
  callback(null, { stdout: '', stderr: '' });
};

exec.mockImplementation(mockExecImplementation);
fs.existsSync.mockReturnValue(true);
fs.statSync.mockReturnValue({ size: 1024 });
fs.mkdirSync.mockReturnValue(undefined);

const { convertPdfToImage } = require('../../backend/services/pdfToImage');
const { compressPdf } = require('../../backend/services/compressPdf');
const { splitPdf } = require('../../backend/services/splitPdf');
const { mergePdfs } = require('../../backend/services/mergePdf');

describe('PDF to Image Conversion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 2048 });
  });

  test('should call exec with correct ImageMagick command for high quality', async () => {
    const inputPath = '/uploads/test.pdf';
    const result = await convertPdfToImage(inputPath, 'high', 'png');
    expect(exec).toHaveBeenCalled();
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('convert');
    expect(cmd).toContain('-density 300');
    expect(cmd).toContain('-quality 90');
    expect(cmd).toContain(inputPath);
  });

  test('should call exec with correct DPI for medium quality', async () => {
    const inputPath = '/uploads/test.pdf';
    await convertPdfToImage(inputPath, 'medium', 'png');
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('-density 150');
    expect(cmd).toContain('-quality 75');
  });

  test('should call exec with correct DPI for low quality', async () => {
    const inputPath = '/uploads/test.pdf';
    await convertPdfToImage(inputPath, 'low', 'png');
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('-density 72');
    expect(cmd).toContain('-quality 60');
  });

  test('should return outputPath, outputName, and size on success', async () => {
    const result = await convertPdfToImage('/uploads/test.pdf', 'high', 'png');
    expect(result).toHaveProperty('outputPath');
    expect(result).toHaveProperty('outputName');
    expect(result).toHaveProperty('size');
    expect(result.size).toBe(2048);
  });

  test('should include correct format extension in output name', async () => {
    const result = await convertPdfToImage('/uploads/test.pdf', 'high', 'jpg');
    expect(result.outputName).toMatch(/\.jpg$/);
  });

  test('should throw error when exec fails', async () => {
    exec.mockImplementation((cmd, callback) => {
      callback(new Error('ImageMagick not found'), null, 'command not found');
    });
    await expect(convertPdfToImage('/uploads/test.pdf', 'high', 'png')).rejects.toThrow();
  });

  test('should throw error when output file not created', async () => {
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(false);
    await expect(convertPdfToImage('/uploads/test.pdf', 'high', 'png')).rejects.toThrow('Conversion failed');
  });
});

describe('Compress PDF Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 512 });
  });

  test('should call exec with Ghostscript command for medium compression', async () => {
    const inputPath = '/uploads/test.pdf';
    await compressPdf(inputPath, 'medium');
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('gs');
    expect(cmd).toContain('-sDEVICE=pdfwrite');
    expect(cmd).toContain('/ebook');
    expect(cmd).toContain(inputPath);
  });

  test('should use /printer setting for high quality', async () => {
    await compressPdf('/uploads/test.pdf', 'high');
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('/printer');
  });

  test('should use /screen setting for low quality (max compression)', async () => {
    await compressPdf('/uploads/test.pdf', 'low');
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('/screen');
  });

  test('should return outputPath, outputName, and size on success', async () => {
    const result = await compressPdf('/uploads/test.pdf', 'medium');
    expect(result).toHaveProperty('outputPath');
    expect(result).toHaveProperty('outputName');
    expect(result).toHaveProperty('size');
  });

  test('should throw error when exec fails', async () => {
    exec.mockImplementation((cmd, callback) => {
      callback(new Error('Ghostscript not found'), null, '');
    });
    await expect(compressPdf('/uploads/test.pdf', 'medium')).rejects.toThrow();
  });

  test('should throw error when output not created', async () => {
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(false);
    await expect(compressPdf('/uploads/test.pdf', 'medium')).rejects.toThrow('Compression failed');
  });
});

describe('Split PDF Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 768 });
  });

  test('should call exec with qpdf command containing page range', async () => {
    const inputPath = '/uploads/test.pdf';
    await splitPdf(inputPath, '1-3');
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('qpdf');
    expect(cmd).toContain(inputPath);
    expect(cmd).toContain('1-3');
  });

  test('should handle comma-separated page ranges', async () => {
    await splitPdf('/uploads/test.pdf', '1,3,5-7');
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('1,3,5-7');
  });

  test('should return outputPath, outputName, and size on success', async () => {
    const result = await splitPdf('/uploads/test.pdf', '1-2');
    expect(result).toHaveProperty('outputPath');
    expect(result).toHaveProperty('outputName');
    expect(result).toHaveProperty('size');
  });

  test('should throw error when exec fails', async () => {
    exec.mockImplementation((cmd, callback) => {
      callback(new Error('qpdf not found'), null, '');
    });
    await expect(splitPdf('/uploads/test.pdf', '1-3')).rejects.toThrow();
  });

  test('should throw error when output not created', async () => {
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(false);
    await expect(splitPdf('/uploads/test.pdf', '1-3')).rejects.toThrow('Split failed');
  });
});

describe('Merge PDFs Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 4096 });
  });

  test('should call exec with qpdf merge command', async () => {
    const inputPaths = ['/uploads/file1.pdf', '/uploads/file2.pdf'];
    await mergePdfs(inputPaths);
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('qpdf');
    expect(cmd).toContain('--empty');
    expect(cmd).toContain('/uploads/file1.pdf');
    expect(cmd).toContain('/uploads/file2.pdf');
  });

  test('should throw error when fewer than 2 files provided', async () => {
    await expect(mergePdfs(['/uploads/file1.pdf'])).rejects.toThrow('Need at least 2 PDFs');
  });

  test('should return outputPath, outputName, and size on success', async () => {
    const result = await mergePdfs(['/uploads/a.pdf', '/uploads/b.pdf']);
    expect(result).toHaveProperty('outputPath');
    expect(result).toHaveProperty('outputName');
    expect(result).toHaveProperty('size');
  });

  test('should handle merging 3 or more files', async () => {
    const inputPaths = ['/uploads/a.pdf', '/uploads/b.pdf', '/uploads/c.pdf'];
    await mergePdfs(inputPaths);
    const cmd = exec.mock.calls[0][0];
    expect(cmd).toContain('/uploads/a.pdf');
    expect(cmd).toContain('/uploads/b.pdf');
    expect(cmd).toContain('/uploads/c.pdf');
  });

  test('should throw error when exec fails', async () => {
    exec.mockImplementation((cmd, callback) => {
      callback(new Error('qpdf merge failed'), null, '');
    });
    await expect(mergePdfs(['/uploads/a.pdf', '/uploads/b.pdf'])).rejects.toThrow();
  });

  test('should throw error when output not created', async () => {
    exec.mockImplementation(mockExecImplementation);
    fs.existsSync.mockReturnValue(false);
    await expect(mergePdfs(['/uploads/a.pdf', '/uploads/b.pdf'])).rejects.toThrow('Merge failed');
  });
});
