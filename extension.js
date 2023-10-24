/*
Copyright 2023 Open Foodservice System Consortium

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// QR Code is a registered trademark of DENSO WAVE INCORPORATED.

const vscode = require('vscode');

function activate(context) {

	context.subscriptions.push(vscode.commands.registerCommand('receipt-markdown.preview', () => {

		// preview

		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'receipt') {
			return;
		}

		const subscription = vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document === editor.document) {
				panel.webview.postMessage(editor.document.getText());
			}
		}, null, context.subscriptions);

		const panel = vscode.window.createWebviewPanel(
			'receipt',
			`Preview ${editor.document.fileName}`,
			vscode.ViewColumn.Beside,
			{ enableScripts: true }
		);

		panel.onDidChangeViewState(() => {
			if (editor) {
				panel.webview.postMessage(editor.document.getText());
			}
		}, null, context.subscriptions);

		panel.onDidDispose(() => {
			subscription.dispose();
		}, null, context.subscriptions);

		const pathPreview = vscode.Uri.joinPath(context.extensionUri, 'preview', 'preview.js');
		const pathReceiptline = vscode.Uri.joinPath(context.extensionUri, 'preview', 'receiptline.js');
		const pathQrcode = vscode.Uri.joinPath(context.extensionUri, 'preview', 'qrcode-generator', 'qrcode.js');

		const srcPreview = panel.webview.asWebviewUri(pathPreview);
		const srcReceiptline = panel.webview.asWebviewUri(pathReceiptline);
		const srcQrcode = panel.webview.asWebviewUri(pathQrcode);

		panel.webview.html = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<script type="text/javascript" src="${srcPreview}"></script>
		<script type="text/javascript" src="${srcReceiptline}"></script>
		<script type="text/javascript" src="${srcQrcode}"></script>
	</head>
	<body onload="initialize()">
		<div>
			<select id="lang">
				<option value="-">(default)</option>
				<option value="ja">ja</option>
				<option value="zh-Hans">zh-Hans</option>
				<option value="zh-Hant">zh-Hant</option>
				<option value="ko">ko</option>
				<option value="th">th</option>
			</select>
			<label for="linewidth">Width</label>
			<input id="linewidth" type="range" value="576" min="288" max="576" step="12">
			<span id="dots">576</span> dots / <span id="cpl">48</span> cpl
			<input id="landscape" type="checkbox">
			<label for="landscape">Landscape</label>
			<input id="linespace" type="checkbox" checked="checked">
			<label for="linespace">Spacing</label>
		</div>
		<hr>
		<div id="printarea" style="display: inline-block; padding: 12px; background-color: #fff;"></div>
	</body>
</html>`;
	}));

	// drag and drop

	context.subscriptions.push(vscode.languages.registerDocumentDropEditProvider('receipt', {
		async provideDocumentDropEdits(document, position, dataTransfer, token) {
			let text = '';
			if (!token.isCancellationRequested) {
				if (document.lineAt(position).isEmptyOrWhitespace) {
					const item = dataTransfer.get('text/uri-list');
					if (item) {
						const uris = (await item.asString()).split('\r\n');
						for (const uri of uris) {
							const data = await vscode.workspace.fs.readFile(vscode.Uri.parse(uri));
							const base64 = Buffer.from(data).toString('base64');
							if (base64.startsWith('iVBORw0KGg')) {
								text += `{image:${base64}}\n`;
							}
						}
					}
				}
			}
			return { insertText: text };
		}
	}));

	// completion items

	const completionItems = [
		{
			label: 'image',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('image:Drag the png file, hold [shift] and drop it on a blank line'),
			detail: 'Insert image.',
			documentation: new vscode.MarkdownString('```\n{image: base64 png format}\n{i: base64 png format}\n```\n- Drag the png file, hold [shift] and drop it on a blank line\n- The png file is recommended to be monochrome and has no auxiliary chunks')
		},
		{
			label: 'code',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('code:${1:barcode / 2D code data}'),
			detail: 'Insert barcode / 2D code.',
			documentation: new vscode.MarkdownString('```\n{code: string}\n{c: string}\n```\n- Check digit can be omitted\n- Incorrect check digit will be corrected')
		},
		{
			label: 'command',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('command:${1:device-specific commands}'),
			detail: 'Insert device-specific commands.',
			documentation: new vscode.MarkdownString('```\n{command: string}\n{x: string}\n```')
		},
		{
			label: 'comment',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('comment:${1:comment}'),
			detail: 'Insert comment.',
			documentation: new vscode.MarkdownString('```\n{comment: string}\n{_: string}\n```')
		},
		{
			label: 'option',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('option:${1|code128,code93,nw7,codabar,itf,code39,jan,ean,upc,qrcode|},${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|},${5|l,m,q,h|}'),
			detail: 'Set barcode / 2D code options.',
			documentation: new vscode.MarkdownString('```\n{option: value, value, ...}\n{o: value, value, ...}\n```\n- Barcode options\n  - (barcode type) code128, code93, nw7, codabar, itf, code39, jan, ean, upc\n  - (module width) 2, 3, 4\n  - (module height) 24 - 240\n  - (human readable interpretation) hri, nohri\n- 2D code options\n  - (2D code type) qrcode\n  - (cell size) 3, 4, 5, 6, 7, 8\n  - (error correction level) l, m, q, h\n- Note\n  - Values are separated by commas or one or more whitespaces\n  - Values can be in any order\n  - Each value can be omitted\n  - The unit is pixel\n  - The default barcode options are code128, 2, 72, nohri\n  - The default qrcode options are 3, l')
		},
		{
			label: 'border',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('border:${1|space,none,line,0,1,2|}'),
			detail: 'Set column border.',
			documentation: new vscode.MarkdownString('```\n{border: value}\n{b: value}\n```\n- Values\n  - (border type) space, none, line\n  - (column spacing) 0, 1, 2\n- Note\n  - space is the same as 1\n  - none is the same as 0\n  - The unit is the number of characters\n  - The default value is space')
		},
		{
			label: 'width',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('width:${1|auto,*,0,1,2,3,4,5,6,7,8,9,10|}'),
			detail: 'Set column widths.',
			documentation: new vscode.MarkdownString('```\n{width: value, value, ...}\n{w: value, value, ...}\n```\n- Values\n  - (column width) 0, 1, 2, ...\n  - (automatic) *\n  - (* for all columns) auto\n- Note\n  - Values are separated by commas or one or more whitespaces\n  - The unit is the number of characters\n  - The default value is auto')
		},
		{
			label: 'align',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('align:${1|center,left,right|}'),
			detail: 'Set line alignment.',
			documentation: new vscode.MarkdownString('```\n{align: value}\n{a: value}\n```\n- Values\n  - center, left, right\n- Note\n  - The default value is center')
		},
		{
			label: 'text',
			kind: vscode.CompletionItemKind.Property,
			insertText: new vscode.SnippetString('text:${1|wrap,nowrap|}'),
			detail: 'Set text wrapping.',
			documentation: new vscode.MarkdownString('```\n{text: value}\n{t: value}\n```\n- Values\n  - wrap, nowrap\n- Note\n  - The default value is wrap')
		}
	];

	const snippetCompletionItems = [
		{
			label: 'upc',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:01234567890};option:upc,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert UPC-A / UPC-E.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: upc, width, height, hri}\n```\n- Data\n  - (UPC-A) 12 digits\n  - (UPC-E) 8 digits starting with 0\n  - Check digit can be omitted\n  - Incorrect check digit will be corrected\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~upc'
		},
		{
			label: 'ean',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:201234567890};option:ean,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert EAN-13 / EAN-8.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: ean, width, height, hri}\n```\n- Data\n  - (EAN-13) 13 digits\n  - (EAN-8) 8 digits\n  - Check digit can be omitted\n  - Incorrect check digit will be corrected\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~ean'
		},
		{
			label: 'jan',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:201234567890};option:jan,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert EAN-13 / EAN-8.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: jan, width, height, hri}\n```\n- Data\n  - (EAN-13) 13 digits\n  - (EAN-8) 8 digits\n  - Check digit can be omitted\n  - Incorrect check digit will be corrected\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~jan'
		},
		{
			label: 'code39',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:ABCD1234};option:code39,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert CODE39.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: code39, width, height, hri}\n```\n- Data\n  - Numbers\n  - Alphabets (uppercase)\n  - Symbols (-, ., $, +, %)\n  - Spaces\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~code39'
		},
		{
			label: 'itf',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:12012345678900};option:itf,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert Interleaved 2 of 5.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: itf, width, height, hri}\n```\n- Data\n  - Even number of digits\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~itf'
		},
		{
			label: 'codabar',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:A1234A};option:codabar,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert Codabar (NW-7).',
			documentation: new vscode.MarkdownString('```\n{code: data; option: codabar, width, height, hri}\n```\n- Data\n  - Start code (A, B, C, D)\n  - Numbers, symbols (-, ., $, :, /, +)\n  - Stop code (A, B, C, D)\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~codabar'
		},
		{
			label: 'nw7',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:A1234A};option:nw7,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert Codabar (NW-7).',
			documentation: new vscode.MarkdownString('```\n{code: data; option: nw7, width, height, hri}\n```\n- Data\n  - Start code (A, B, C, D)\n  - Numbers, symbols(-, ., $, :, /, +)\n  - Stop code (A, B, C, D)\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~nw7'
		},
		{
			label: 'code93',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:abcd1234};option:code93,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert CODE93.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: code93, width, height, hri}\n```\n- Data\n  - ASCII characters\n  - Escape characters (\\\\\\\\, \\\\|, \\\\{, \\\\}, \\\\;, \\n, \\x*nn*)\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~code93'
		},
		{
			label: 'code128',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:abcd1234};option:code128,${2|2,3,4|},${3|24,48,72,96,120,144,168,192,216,240|},${4|nohri,hri|}'),
			detail: 'Insert CODE128.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: code128, width, height, hri}\n```\n- Data\n  - ASCII characters\n  - Escape characters (\\\\\\\\, \\\\|, \\\\{, \\\\}, \\\\;, \\n, \\x*nn*)\n- Module width\n  - 2, 3, 4\n- Module height\n  - 24 - 240\n- Human readable interpretation\n  - nohri, hri'),
			sortText: '~code128'
		},
		{		
			label: 'qrcode',
			kind: vscode.CompletionItemKind.Snippet,
			insertText: new vscode.SnippetString('code:${1:1234567890};option:qrcode,${2|3,4,5,6,7,8|},${3|l,m,q,h|}'),
			detail: 'Insert QR Code.',
			documentation: new vscode.MarkdownString('```\n{code: data; option: qrcode, size, level}\n```\n- Data\n  - Unicode characters\n  - Escape characters (\\\\\\\\, \\\\|, \\\\{, \\\\}, \\\\;, \\n, \\x*nn*)\n- Cell size\n  - 3, 4, 5, 6, 7, 8\n- Error correction level\n  - l, m, q, h\n- Note\n  - QR Code is a registered trademark of DENSO WAVE INCORPORATED'),
			sortText: '~qrcode'
		}
	];

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('receipt', {
		provideCompletionItems(document, position, token, context) {
			const prefix = document.lineAt(position).text.slice(0, position.character);
			if (/^[ /t]*\|?[ /t]*\{$/.test(prefix)) {
				return new vscode.CompletionList([...completionItems, ...snippetCompletionItems]);
			}
		}
	}, '{'));

	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('receipt', {
		provideCompletionItems(document, position, token, context) {
			const prefix = document.lineAt(position).text.slice(0, position.character);
			if (/^[ /t]*\|?[ /t]*\{(?:\\[^x]|\\x..|[^\\])*;$/.test(prefix)) {
				return new vscode.CompletionList(completionItems);
			}
		}
	}, ';'));

	// hover

	const hover = {
		image: 'Insert image',
		code: 'Insert barcode / 2D code',
		command: 'Insert command',
		comment: 'Insert comment',
		option: 'Set barcode / 2D code options',
		align: 'Set line alignment',
		width: 'Set column width',
		border: 'Set column border',
		text: 'Set text wrap'
	};
	const abbr = {
		i: hover.image, c: hover.code, x: hover.command,
		_: hover.comment, o: hover.option, a: hover.align,
		w: hover.width, b: hover.border, t: hover.text
	};
	const hoverItems = { ...hover, ...abbr };

	context.subscriptions.push(vscode.languages.registerHoverProvider('receipt', {
		provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position, /[_a-zA-Z][_0-9a-zA-Z]*/);
			if (range) {
				const line = document.lineAt(position).text;
				const word = line.slice(range.start.character, range.end.character);
				if (word in hoverItems) {
					const prefix = line.slice(0, range.start.character);
					const suffix = line.slice(range.end.character);
					if (/^[ /t]*\|?[ /t]*\{((?:\\[^x]|\\x..|[^\\])*;)?[ /t]*$/.test(prefix) && /^[ /t]*:/.test(suffix)) {
						return new vscode.Hover([ hoverItems[word] ]);
					}
				}
			}
		}
	}));
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
