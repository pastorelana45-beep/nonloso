
import JSZip from 'https://esm.sh/jszip@^3.10.1';

/**
 * Esporta l'intero progetto VocalSynth Pro in un file ZIP.
 * Sono stati rimossi i file della licenza e pro landing.
 */
export async function downloadProjectZip() {
  const zip = new JSZip();

  const files = [
    'index.html',
    'index.tsx',
    'App.tsx',
    'types.ts',
    'constants.ts',
    'pitchDetection.ts',
    'metadata.json',
    'manifest.json',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'vercel.json',
    'sw.js'
  ];

  const components = [
    'Header.tsx',
    'Visualizer.tsx',
    'InstrumentGrid.tsx',
    'MidiKeyboard.tsx'
  ];

  const services = [
    'audioEngine.ts',
    'midiExport.ts',
    'projectExporter.ts'
  ];

  const fetchAndAdd = async (path: string, zipFolder: any = zip) => {
    try {
      const response = await fetch(`./${path}`);
      if (response.ok) {
        const content = await response.text();
        const fileName = path.split('/').pop() || path;
        zipFolder.file(fileName, content);
      }
    } catch (e) {
      console.warn(`Impossibile includere ${path}:`, e);
    }
  };

  const rootPromises = files.map(f => fetchAndAdd(f));
  const compFolder = zip.folder("components");
  const compPromises = components.map(f => fetchAndAdd(`components/${f}`, compFolder));
  const servFolder = zip.folder("services");
  const servPromises = services.map(f => fetchAndAdd(`services/${f}`, servFolder));

  await Promise.all([...rootPromises, ...compPromises, ...servPromises]);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VocalSynthPro_Source_Free_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
