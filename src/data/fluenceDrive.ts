// Snapshot of the shared Senawave "Design" Drive folder taken on 1 Oct 2026 (owner jessem@senawave.com).
// Used as the offline view of the Files page until Google sign-in with the read-only Drive scope takes over.
import type { DriveNode, DriveSnapshot } from '@/lib/types';

export const DESIGN_FOLDER_ID = '1bv7lYrdYL5X57lFT_amiBk2kMN23XtAD';
export const DESIGN_FOLDER_URL = `https://drive.google.com/drive/folders/${DESIGN_FOLDER_ID}`;
export const FLUENCE_FOLDER_ID = '1NnCqOVjtLFHSCAYfQG8lRF9lMlj9rcKt';
export const FLUENCE_FOLDER_URL = `https://drive.google.com/drive/folders/${FLUENCE_FOLDER_ID}`;

const J = 'jessem@senawave.com';
const F = (id: string, path: string, mime: string, modifiedTime: string, size: number | null, parentId: string | null, isFolder = false): DriveNode => ({
  id,
  name: path.split('/').pop() || path,
  mimeType: mime,
  isFolder,
  parentId,
  path,
  modifiedTime,
  modifiedBy: J,
  size,
  webViewLink: isFolder ? `https://drive.google.com/drive/folders/${id}` : `https://drive.google.com/file/d/${id}/view`,
});
const D = (id: string, path: string, modifiedTime: string, parentId: string | null) => F(id, path, 'application/vnd.google-apps.folder', modifiedTime, null, parentId, true);

const DWG = 'image/vnd.dwg';
const BIN = 'application/octet-stream';
const XML = 'text/xml';
const TXT = 'text/plain';
const PY = 'text/x-python';
const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const KMZ = 'application/vnd.google-earth.kmz';

export const FLUENCE_DRIVE_SNAPSHOT: DriveSnapshot = {
  rootId: DESIGN_FOLDER_ID,
  takenAt: '2026-10-01T16:40:00.000Z',
  source: 'seed',
  nodes: [
    D(DESIGN_FOLDER_ID, 'Design', '2026-09-30T19:30:02Z', null),
    D('1HO0JWjwHPAUyTDaMwR5GBgo68dTr-Y_Z', 'Projects', '2026-09-30T19:39:13Z', DESIGN_FOLDER_ID),
    D('1AeQEtOJJ-MO74QERsGJMOJT7u88NkSI-', 'Templates', '2026-09-30T19:38:48Z', DESIGN_FOLDER_ID),
    // ---- Projects/Fluence
    D(FLUENCE_FOLDER_ID, 'Projects/Fluence', '2026-09-30T19:34:31Z', '1HO0JWjwHPAUyTDaMwR5GBgo68dTr-Y_Z'),
    D('1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI', 'Projects/Fluence/ArcGIS', '2026-09-30T19:36:27Z', FLUENCE_FOLDER_ID),
    D('1dD6QjE1Q6ZPFuPcr1vJczLPN1pRMHbKT', 'Projects/Fluence/CAD', '2026-09-30T19:35:11Z', FLUENCE_FOLDER_ID),
    // CAD
    F('11_l74IoBFXCk7spbCygc1YhbeMWu-Q56', 'Projects/Fluence/CAD/Fluence.dwg', DWG, '2026-09-30T20:01:46Z', 1665914, '1dD6QjE1Q6ZPFuPcr1vJczLPN1pRMHbKT'),
    F('1OE1OsTO77GKkS61Q6Jqahdc0SujsPdZu', 'Projects/Fluence/CAD/Fluence.bak', BIN, '2026-09-30T20:00:56Z', 1672698, '1dD6QjE1Q6ZPFuPcr1vJczLPN1pRMHbKT'),
    D('1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-', 'Projects/Fluence/CAD/xref', '2026-09-30T19:34:34Z', '1dD6QjE1Q6ZPFuPcr1vJczLPN1pRMHbKT'),
    F('1nGkBGMjpLeizZ7059V6gtjgQXiTx2QBN', 'Projects/Fluence/CAD/xref/SheetIndex.dwg', DWG, '2026-09-29T20:54:05Z', 13718, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('1vHVJ7B7ymRyHup2qBTNUV6fN3DWbCjA7', 'Projects/Fluence/CAD/xref/Power.dwg', DWG, '2026-09-29T21:43:23Z', 15987, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('176ca6HpzasxYqDFL8FGKJnIEjFHfrhtK', 'Projects/Fluence/CAD/xref/Power-UG.dwg', DWG, '2026-09-29T21:47:55Z', 15477, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('1uQHPhgIurJX6x-IYQmqMl9-wQVp_GgkI', 'Projects/Fluence/CAD/xref/OtherComm.dwg', DWG, '2026-09-29T21:53:35Z', 13749, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('13OPIk3OLQVimWDu05kmKnnwClZkpfLOd', 'Projects/Fluence/CAD/xref/Sewer.dwg', DWG, '2026-09-29T21:20:50Z', 18461, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('19Uos9tU-xl1MKv0-YBDIRolwJjI7YjCQ', 'Projects/Fluence/CAD/xref/Storm.dwg', DWG, '2026-09-29T21:25:12Z', 16446, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('15DQTQviZuRQqk-9OjNbTn1fEnPdsLbbw', 'Projects/Fluence/CAD/xref/Water.dwg', DWG, '2026-09-29T21:26:48Z', 29872, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('1rTwrAPGxxKuO0n9S4s9NKsPBIpAnzl-C', 'Projects/Fluence/CAD/xref/Buildings.dwg', DWG, '2026-09-30T16:05:03Z', 16758, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('16sTgUfn9--1J3UY23UjeQ-6Dzz5JHQkH', 'Projects/Fluence/CAD/xref/Gas.dwg', DWG, '2026-09-30T22:26:31Z', 15349, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('159aGqcE-ZWusZ4Qrx6sBvGV8vzjT0PYD', 'Projects/Fluence/CAD/xref/SheetIndex.dwg.xml', XML, '2026-09-29T20:54:05Z', 623, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('1PDBsEkCzqbsKqHM2C9iBgwR_s5NYNKV5', 'Projects/Fluence/CAD/xref/Buildings.dwg.xml', XML, '2026-09-30T16:05:03Z', 621, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('1l36dahMZTeNdWe1r-DWAse13HsmiX3kl', 'Projects/Fluence/CAD/xref/Gas.dwg.xml', XML, '2026-09-30T22:26:31Z', 619, '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    D('18ZAl10p04stqzgBYhCVXbL97_9Vetd6V', 'Projects/Fluence/CAD/xref/imagery', '2026-09-30T19:34:34Z', '1RnbqkjoCCyO-HsuiCeaWb68lLUoVTPI-'),
    F('1wm2H0Er5TaI2jQIE2hkjP_2_O5S0fCYd', 'Projects/Fluence/CAD/xref/imagery/PLAN-01.png', 'image/png', '2026-09-29T20:55:18Z', 2910278, '18ZAl10p04stqzgBYhCVXbL97_9Vetd6V'),
    F('1oNrJD7L2HWjR2s5hPb2Yytl1Qf8Tbzht', 'Projects/Fluence/CAD/xref/imagery/PLAN-01.pgw', BIN, '2026-09-29T20:55:18Z', 97, '18ZAl10p04stqzgBYhCVXbL97_9Vetd6V'),
    F('1tPDGsABNl-Qas_JWzI8UpD4fXmb9Enpm', 'Projects/Fluence/CAD/xref/imagery/imagery-credits.txt', TXT, '2026-09-29T20:55:18Z', 52, '18ZAl10p04stqzgBYhCVXbL97_9Vetd6V'),
    // ArcGIS
    F('1wctIicuYEmaN_JMG02F-dBqbi0dB6Mss', 'Projects/Fluence/ArcGIS/Fluence.aprx', 'application/x-zip', '2026-09-30T20:01:50Z', 151481, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1NSEzvPkQ2SDBl-exIS84_ZOKinlWa07l', 'Projects/Fluence/ArcGIS/Fluence.atbx', 'application/x-zip', '2026-09-24T15:41:33Z', 393, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    D('1o14QgmD26RtGF2R6f466DwPt8Sb33uJi', 'Projects/Fluence/ArcGIS/Fluence.gdb', '2026-09-30T19:41:07Z', '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1rHC3rpiD9SHy8Sw54PHvs-vTzTuJrA2g', 'Projects/Fluence/ArcGIS/ImportKML.ipynb', BIN, '2026-09-30T16:05:39Z', 14245, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('138Nd5aaXOKHQkj2g6-f6kIunNbsoO5j9', 'Projects/Fluence/ArcGIS/ExportGeopackage.ipynb', BIN, '2026-09-30T16:05:39Z', 1078, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1kZrnnAKd6XlUa1J2PwDWP7tIcCVsUHkp', 'Projects/Fluence/ArcGIS/.pyHistory', BIN, '2026-09-29T20:54:40Z', 42080, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1-fBIxOD8sDhxof2zDwmXgjHsIGfxy9ML', 'Projects/Fluence/ArcGIS/scratch.shp', BIN, '2026-09-24T21:56:02Z', 22276, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1rmLEyABz44K7mEg18Gzj5cDTs7i4Y2NH', 'Projects/Fluence/ArcGIS/scratch.dbf', BIN, '2026-09-24T21:56:02Z', 527978, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1tuqpDMSnYOnxzK7fi1GhBtH0_I-05aYR', 'Projects/Fluence/ArcGIS/scratch.prj', BIN, '2026-09-24T21:42:47Z', 269, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1dV16KOGStc7XlRNacrG-dqgkdKYDBmKl', 'Projects/Fluence/ArcGIS/scratch.shp.xml', XML, '2026-09-24T21:56:02Z', 29716, '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    D('1ehz-twqVtMkIqAVAKF3kwEz7BZSHqbc6', 'Projects/Fluence/ArcGIS/Index', '2026-09-30T19:36:36Z', '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    D('1mlZNuS9PAaFnsi6fe0S5I8E1xxs3mEyJ', 'Projects/Fluence/ArcGIS/GpMessages', '2026-09-30T19:41:43Z', '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    D('1yqBbafson99G0a2jBPzN4ZoedgPDnlZY', 'Projects/Fluence/ArcGIS/.backups', '2026-09-30T19:46:51Z', '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    D('1oA0zAEE3-nBnxWPeFpQkqgiKjsmOGhrX', 'Projects/Fluence/ArcGIS/scratch', '2026-09-30T19:36:36Z', '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    D('15OUbOlGwtaaH42qAqqSSi7Yl8u8FgQX4', 'Projects/Fluence/ArcGIS/Shared', '2026-09-30T19:36:36Z', '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1IIqY2iwsNSypzeY-DOM1IBU7603ZgDw8', 'Projects/Fluence/ArcGIS/Shared/Fluence.gpkg', BIN, '2026-09-29T19:52:43Z', 811008, '15OUbOlGwtaaH42qAqqSSi7Yl8u8FgQX4'),
    F('1-5mZOWMeEs1z1DTPM-hg4CQstMBWwYyP', 'Projects/Fluence/ArcGIS/Shared/ProposedBuriedFiber_Senawave.gpkg', BIN, '2026-09-24T16:11:44Z', 118784, '15OUbOlGwtaaH42qAqqSSi7Yl8u8FgQX4'),
    F('1GdEpuzrzHweqVy20GP-Z79n9z3wxTLlW', 'Projects/Fluence/ArcGIS/Shared/ProposedBuriedFiber_Senawave.kmz', KMZ, '2026-09-24T16:02:00Z', 2789, '15OUbOlGwtaaH42qAqqSSi7Yl8u8FgQX4'),
    F('1E7aFhrx2SoP9eMgvcxgotG7aCbOiLbY-', 'Projects/Fluence/ArcGIS/Shared/ProposedBuriedFiber_Senawave.pdf', PDF, '2026-09-24T15:59:36Z', 203258, '15OUbOlGwtaaH42qAqqSSi7Yl8u8FgQX4'),
    D('1i19f-7vIz8KlrgFoLhm38kbWV1Rc2SqP', 'Projects/Fluence/ArcGIS/OgdenCityKMZ', '2026-09-30T19:36:36Z', '1EmZS27afA8PfnUpA9nSzpgnDXZeKY9uI'),
    F('1UpLaMRWbvlM5EHCMfgKiJCWdLd-2NXf3', 'Projects/Fluence/ArcGIS/OgdenCityKMZ/Sewer_Laterals.kmz', KMZ, '2026-09-24T20:49:15Z', 3211, '1i19f-7vIz8KlrgFoLhm38kbWV1Rc2SqP'),
    F('1JEcSRZuINqhqApY2ml-rF6Uq9tpQpNEA', 'Projects/Fluence/ArcGIS/OgdenCityKMZ/Sewer_Mains.kmz', KMZ, '2026-09-24T20:49:15Z', 3208, '1i19f-7vIz8KlrgFoLhm38kbWV1Rc2SqP'),
    F('15K_ctg20b4xtRCjVbB3xOVEkGo3TXTrw', 'Projects/Fluence/ArcGIS/OgdenCityKMZ/Sewer_Manholes.kmz', KMZ, '2026-09-24T20:49:15Z', 3477, '1i19f-7vIz8KlrgFoLhm38kbWV1Rc2SqP'),
    F('1rvXFKs43D7VAGIm4KX8qSHGUODzn3hhw', 'Projects/Fluence/ArcGIS/OgdenCityKMZ/Storm_Cleanouts.kmz', KMZ, '2026-09-24T20:49:15Z', 3321, '1i19f-7vIz8KlrgFoLhm38kbWV1Rc2SqP'),
    F('1qSUF7NeBCe1HpOIeyLRuy8I9Frb_C6Rd', 'Projects/Fluence/ArcGIS/OgdenCityKMZ/Water_Meters.kmz', KMZ, '2026-09-24T20:49:15Z', 3792, '1i19f-7vIz8KlrgFoLhm38kbWV1Rc2SqP'),
    // ---- Templates/CAD
    D('1GE-2BzefBEHzU28RKjXaBm28ViYn9DlY', 'Templates/CAD', '2026-09-30T19:39:41Z', '1AeQEtOJJ-MO74QERsGJMOJT7u88NkSI-'),
    F('1UdJxrOFYHXdnD0KWqziNF7WsVGNdzCAO', 'Templates/CAD/SENAWAVE-Plan-Production-Guide.docx', DOCX, '2026-09-29T22:45:44Z', 154570, '1GE-2BzefBEHzU28RKjXaBm28ViYn9DlY'),
    F('129Ouf01d1w_cthEE3qOGIjBHD7wEJQtL', 'Templates/CAD/SENAWAVE-11x17-TEMPLATE.dwt', BIN, '2026-09-29T22:50:40Z', 1541867, '1GE-2BzefBEHzU28RKjXaBm28ViYn9DlY'),
    F('1kY-hoKx_UlSvijSrPd0pqMx0nwHZDLH-', 'Templates/CAD/SENAWAVE-11x17-TEMPLATE.bak', BIN, '2026-09-29T15:38:15Z', 1528437, '1GE-2BzefBEHzU28RKjXaBm28ViYn9DlY'),
    D('1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq', 'Templates/CAD/Support', '2026-09-30T19:38:49Z', '1GE-2BzefBEHzU28RKjXaBm28ViYn9DlY'),
    F('1gWLDioL4JNJjGmSR1WOSn0jiO-zb3L8G', 'Templates/CAD/Support/SENAWAVE-LOADALL.lsp', TXT, '2026-09-29T16:21:50Z', 2382, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1PClpDRFVbFWWOoNC7CT4mOKRasQqmy1Z', 'Templates/CAD/Support/SENAWAVELOAD.lsp', TXT, '2026-09-29T22:45:30Z', 9341, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1cJcPtT3GFtOKBQuKWTLUMLlDvPjOJTWd', 'Templates/CAD/Support/SENAUNITS.lsp', TXT, '2026-09-29T14:45:51Z', 28796, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1ptILZnjR5pxjoWJuHUt83sKWpraWIBGP', 'Templates/CAD/Support/SENALTYPE.lsp', TXT, '2026-09-29T14:45:51Z', 11146, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1FlhDgV2_0dMiULJvrybFlNaqe5MMqbnL', 'Templates/CAD/Support/SENACLIP.lsp', TXT, '2026-09-29T16:21:49Z', 14943, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('19CEUWuIzRFx0mSe884ybRYdqd8L78_7r', 'Templates/CAD/Support/SENASIDE.lsp', TXT, '2026-09-28T22:46:10Z', 61458, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1w19ujgrxGxPToa1XoBhT9hec6r31UE_u', 'Templates/CAD/Support/SENAVICINITY.lsp', TXT, '2026-09-03T21:48:55Z', 29891, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1kuKkiM-ZBepxDO0vQxakvkXpkx8x5bOP', 'Templates/CAD/Support/SENATITLE.lsp', TXT, '2026-08-13T21:51:01Z', 5588, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1HQbaxcZQ0OTwMNkpEIwcL1pXI94VN8ef', 'Templates/CAD/Support/SENAMIGRATE.lsp', TXT, '2026-09-28T22:46:10Z', 5501, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1-Ivcm_tAmG5lhQAxiYJ4F9jTeF9bqhFr', 'Templates/CAD/Support/PT2BLK.lsp', TXT, '2026-08-21T16:38:15Z', 4272, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1TW1TU4FJDHqJH29CPcEYMRUsX5zLr7WT', 'Templates/CAD/Support/SENAWAVE-PAPER.lin', TXT, '2026-09-03T18:26:22Z', 4985, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('1u4qE2d4mcxGeTemTelZkhVbFowux1iX8', 'Templates/CAD/Support/SENAWAVE-FIBER-SYMBOLS.dxf', 'application/dxf', '2026-09-04T20:43:16Z', 1408379, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    F('12qhn1f7SV8HL90TfVyOUGBxEijjF7amP', 'Templates/CAD/Support/SENAWAVE-11x17-DRAWORDER.lst', BIN, '2026-08-28T16:22:40Z', 424, '1rhRv8uibo_8DN2AryJJaiCWbY9FZkWuq'),
    D('1-5wuOrb0M9Zi82wPbe3RIzlsAPKQhvAh', 'Templates/CAD/ArcGIS', '2026-09-30T19:38:49Z', '1GE-2BzefBEHzU28RKjXaBm28ViYn9DlY'),
    F('1-ww2APoJZsd5sIHgUe6oSy0U6svV-qf_', 'Templates/CAD/ArcGIS/SENAWAVE-SheetIndex.py', PY, '2026-09-29T16:52:04Z', 23613, '1-5wuOrb0M9Zi82wPbe3RIzlsAPKQhvAh'),
    F('13mY-ny1JOYodqMSfxqhlmBssJKBItYeb', 'Templates/CAD/ArcGIS/SENAWAVE-SheetImagery.py', PY, '2026-09-29T19:32:53Z', 17282, '1-5wuOrb0M9Zi82wPbe3RIzlsAPKQhvAh'),
    F('16h2CGOT1PVSd0F1_A6WLSMDz-g8SIa5k', 'Templates/CAD/ArcGIS/SENAWAVE-KeyMapBasemap.py', PY, '2026-09-29T19:32:54Z', 16529, '1-5wuOrb0M9Zi82wPbe3RIzlsAPKQhvAh'),
    F('1ZbLu5cgm2L9xq4Mgs9pGBsWvlFdwHI4L', 'Templates/CAD/ArcGIS/SENAWAVE-ARCGIS-SEED.dwg', DWG, '2026-09-08T23:49:12Z', 13441, '1-5wuOrb0M9Zi82wPbe3RIzlsAPKQhvAh'),
    D('1MYd5XAft6yC8XmXELY61-R-525yNJ0Us', 'Templates/CAD/Archive', '2026-09-30T19:38:49Z', '1GE-2BzefBEHzU28RKjXaBm28ViYn9DlY'),
    D('1RnIkLaWNKrZ9ZTkvTnj4uumEFxT1Ek5l', 'Templates/CAD/Archive/2026-07-16', '2026-09-30T19:38:50Z', '1MYd5XAft6yC8XmXELY61-R-525yNJ0Us'),
    D('1WRY8w4Nl9PZxqcoYwAwJ6RRw29rV159S', 'Templates/CAD/Archive/2026-08-04', '2026-09-30T19:38:50Z', '1MYd5XAft6yC8XmXELY61-R-525yNJ0Us'),
    D('1EWYQT1S2de3pC99OmQG4R4Hq_pLiRCxd', 'Templates/CAD/Archive/2026-08-13', '2026-09-30T19:38:50Z', '1MYd5XAft6yC8XmXELY61-R-525yNJ0Us'),
    D('1P7dRb3L5mjS2AO68mCaRp_9mDxy8f3Tq', 'Templates/CAD/Archive/2026-09-29', '2026-09-30T19:38:50Z', '1MYd5XAft6yC8XmXELY61-R-525yNJ0Us'),
    F('12y6QOyK5zC-BoOD6AxH9aoGlMl8QP_KQ', 'Templates/CAD/Archive/2026-09-29/SENAWAVE-11x17-TEMPLATE.dwt', BIN, '2026-09-29T15:38:15Z', 1528437, '1P7dRb3L5mjS2AO68mCaRp_9mDxy8f3Tq'),
    F('1R-ThDj2RZ02hL--n_4-cmi1J49CMXXgr', 'Templates/CAD/Archive/2026-07-16/SC_FON_4x4x4_StandardFiberOpticVault.dwg', DWG, '2026-08-12T17:24:04Z', 427836, '1RnIkLaWNKrZ9ZTkvTnj4uumEFxT1Ek5l'),
    F('1jfJrckT33iIT4efsvpg8SwEyUgb_jd_i', 'Templates/CAD/Archive/2026-07-16/FIBER-VAULT-ATT-9-2.dwg', DWG, '2026-08-12T16:15:36Z', 303745, '1RnIkLaWNKrZ9ZTkvTnj4uumEFxT1Ek5l'),
    F('1mDIMDjCgsUiuPZjCpuyIufZmAREjNWTl', 'Templates/CAD/Archive/2026-07-16/UDOT-HH-DETAIL.dxf', 'application/dxf', '2026-08-10T21:06:43Z', 1984521, '1RnIkLaWNKrZ9ZTkvTnj4uumEFxT1Ek5l'),
    F('1rwiUV_KPDBMhrR8vZXug9AvHSi8r3zkf', 'Templates/CAD/Archive/2026-07-16/UDOT-UTILITY-MARKER-SYMBOL.dxf', 'application/dxf', '2026-08-11T20:40:31Z', 34664, '1RnIkLaWNKrZ9ZTkvTnj4uumEFxT1Ek5l'),
    F('17ediC6_rkxLbvd-P7xOjZR1vAbBQVg4c', 'Templates/CAD/Archive/2026-07-16/SENAWAVE-11x17-TITLEBLOCK.dxf', 'application/dxf', '2026-07-16T18:06:58Z', 1152565, '1RnIkLaWNKrZ9ZTkvTnj4uumEFxT1Ek5l'),
    F('1HU3PdeTLUYlpBD9I6GSf2BLDtKLX5eOt', 'Templates/CAD/Archive/2026-08-04/SENAWAVE-Layer-Standard.docx', DOCX, '2026-08-06T16:18:17Z', 19281, '1WRY8w4Nl9PZxqcoYwAwJ6RRw29rV159S'),
    F('1hmonCRNoTX98wI3okfsN-he6opEcgb7e', 'Templates/CAD/Archive/2026-08-04/SENAWAVE-Symbol-Guide.docx', DOCX, '2026-08-05T22:14:06Z', 228116, '1WRY8w4Nl9PZxqcoYwAwJ6RRw29rV159S'),
    F('1VsyteP8GuhhDWeyfh3O1i4hMs41ZcM2F', 'Templates/CAD/Archive/2026-08-04/SENAWAVE-FIBER-SYMBOLS-Reference.pdf', PDF, '2026-08-05T22:14:06Z', 67276, '1WRY8w4Nl9PZxqcoYwAwJ6RRw29rV159S'),
    F('1GJBteirGMXJEnykF92gpwsTpQ3AL77-6', 'Templates/CAD/Archive/2026-08-13/README-ARCHIVE.txt', TXT, '2026-09-28T22:54:46Z', 1739, '1EWYQT1S2de3pC99OmQG4R4Hq_pLiRCxd'),
  ],
};
