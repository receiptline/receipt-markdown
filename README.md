# Receipt Markdown

## Features

The Receipt Markdown extension adds language support for receipt description language to Visual Studio Code, including editing and preview features.  

![screenshot](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/screenshot.png)  

This language conforms to the OFSC ReceiptLine Specification.  
https://www.ofsc.or.jp/receiptline/en/  

ReceiptLine is the receipt description language that expresses the output image of small roll paper.  
It supports printing paper receipts using a receipt printer and displaying electronic receipts on a POS system or smartphone.  
It can be described simply with receipt markdown text data that does not depend on the paper width.  

The edited file (*.receipt) can be printed on a receipt printer or converted to an image with ReceiptIO.  
https://www.npmjs.com/package/receiptio  

ReceiptIO is a simple print application for receipt printers that prints with easy markdown data for receipts and returns printer status. Even without a printer, it can output images.  

## Syntax

### Railroad diagram

**_document_**  
![document](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/document.png)  

**_line_**  
![line](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/line.png)  

**_columns_**  
![columns](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/columns.png)  

**_column_**  
![column](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/column.png)  

**_text_**  
![text](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/text.png)  

**_char_**  
![char](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/char.png)  

**_escape_**  
![escape](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/escape.png)  

**_ws (whitespace)_**  
![ws](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/ws.png)  

**_property_**  
![property](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/property.png)  

**_member_**  
![member](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/member.png)  

**_key_**  
![key](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/key.png)  

**_value_**  
![value](https://raw.githubusercontent.com/receiptline/receipt-markdown/main/images/value.png)  

## Grammar

### Structure

The receipt is made of a table, which separates each column with a pipe `|`.  

|Line|Content|Description|
|---|---|---|
|_column_<br><code>&#x7c;</code> _column_ <code>&#x7c;</code><br><code>&#x7c;</code> _column_<br>_column_ <code>&#x7c;</code>|Text<br>Property|Single column|
|_column_ <code>&#x7c;</code> _column_ <br><code>&#x7c;</code> _column_ <code>&#x7c;</code> _column_ <code>&#x7c;</code><br><code>&#x7c;</code> _column_ <code>&#x7c;</code> _column_<br>_column_ <code>&#x7c;</code> _column_ <code>&#x7c;</code>|Text|Double column|
|_column_ <code>&#x7c;</code> _..._ <code>&#x7c;</code> _column_<br><code>&#x7c;</code> _column_ <code>&#x7c;</code> _..._ <code>&#x7c;</code> _column_ <code>&#x7c;</code><br><code>&#x7c;</code> _column_ <code>&#x7c;</code> _..._ <code>&#x7c;</code> _column_<br>_column_ <code>&#x7c;</code> _..._ <code>&#x7c;</code> _column_ <code>&#x7c;</code>|Text|Multiple columns|

### Alignment

The column is attracted to the pipe `|` like a magnet.  
<code>&#x2423;</code> means one or more whitespaces.  

|Column|Description|
|---|---|
|_column_<br><code>&#x7c;</code>_column_<code>&#x7c;</code><br><code>&#x7c;&#x2423;</code>_column_<code>&#x2423;&#x7c;</code>|Center|
|<code>&#x7c;</code>_column_<br><code>&#x7c;</code>_column_<code>&#x2423;&#x7c;</code><br>_column_<code>&#x2423;&#x7c;</code>|Left|
|_column_<code>&#x7c;</code><br><code>&#x7c;&#x2423;</code>_column_<code>&#x7c;</code><br><code>&#x7c;&#x2423;</code>_column_|Right|

### Text

The text is valid for any column.  

```
Asparagus | 0.99
Broccoli | 1.99
Carrot | 2.99
---
^TOTAL | ^5.97
```

Characters are printed in a monospace font (12 x 24 px).  
Wide characters are twice as wide as Latin characters (24 x 24 px).  
Control characters are ignored.  

### Special characters in text

Special characters are assigned to characters that are rarely used in the receipt.  

|Special character|Description|
|---|---|
|`\`|Character escape|
|<code>&#x7c;</code>|Column delimiter|
|`{`|Property delimiter (Start)|
|`}`|Property delimiter (End)|
|`-` (1 or more, exclusive)|Horizontal rule|
|`=` (1 or more, exclusive)|Paper cut|
|`~`|Space|
|`_`|Underline|
|`"`|Emphasis|
|`` ` ``|Invert|
|`^`|Double width|
|`^^`|Double height|
|`^^^`|2x size|
|`^^^^`|3x size|
|`^^^^^`|4x size|
|`^^^^^^`|5x size|
|`^^^^^^^` (7 or more)|6x size|

### Escape sequences in text

Escape special characters.  

|Escape sequence|Description|
|---|---|
|`\\`|&#x5c;|
|<code>&#x5c;&#x7c;</code>|&#x7c;|
|`\{`|&#x7b;|
|`\}`|&#x7d;|
|`\-`|&#x2d; (Cancel horizontal rule)|
|`\=`|&#x3d; (Cancel paper cut)|
|`\~`|&#x7e;|
|`\_`|&#x5f;|
|`\"`|&#x5f;|
|``\` ``|&#x60;|
|`\^`|&#x5e;|
|`\n`|Wrap text manually|
|`\x`_nn_|Hexadecimal character code|
|`\`_char_ (Others)|Ignore|

### Properties

The property is valid for lines with a single column.  
Text, images, barcodes, and 2D codes cannot be placed on the same line.  

```
{ width: * 10; comment: the column width is specified in characters }
```

|Key|Abbr|Value|Default|Description|
|---|---|---|---|---|
|`image`|`i`|_base64 png format_|-|Insert image<br>Drag a PNG file, hold [Shift] and drop it on a blank line<br>(Recommended: monochrome, critical chunks only)|
|`code`|`c`|_textdata_|-|Insert barcode / 2D code|
|`command`|`x`|_textdata_|-|Insert device-specific commands|
|`comment`|`_`|_textdata_|-|Insert comment|
|`option`|`o`|_see below_|`code128 2 72 nohri 3 l`|Set barcode / 2D code options<br>(Options are separated by commas or one or more whitespaces)|
|`border`|`b`|`line`<br>`space`<br>`none`<br>`0` - `2`|`space`|Set column border (chars)<br>(Border width: line=1, space=1, none=0)|
|`width`|`w`|`auto`<br>`*`<br>`0` -|`auto`<br>(`*` for all columns)|Set column widths (chars)<br>(Widths are separated by commas or one or more whitespaces)|
|`align`|`a`|`left`<br>`center`<br>`right`|`center`|Set line alignment<br>(Valid when line width &lt; characters per line)|
|`text`|`t`|`wrap`<br>`nowrap`|`wrap`|Set text wrapping|

### Barcode options

Barcode options are separated by commas or one or more whitespaces.  

|Barcode option|Description|
|---|---|
|`upc`|UPC-A, UPC-E<br>(Check digit can be omitted)|
|`ean`<br>`jan`|EAN-13, EAN-8<br>(Check digit can be omitted)|
|`code39`|CODE39|
|`itf`|Interleaved 2 of 5|
|`codabar`<br>`nw7`|Codabar (NW-7)|
|`code93`|CODE93|
|`code128`|CODE128|
|`2` - `4`|Barcode module width (px)|
|`24` - `240`|Barcode module height (px)|
|`hri`|With human readable interpretation|
|`nohri`|Without human readable interpretation|

### 2D code options

2D code options are separated by commas or one or more whitespaces.  

|2D code option|Description|
|---|---|
|`qrcode`|QR Code|
|`3` - `8`|Cell size (px)|
|`l`<br>`m`<br>`q`<br>`h`|Error correction level|

### Special characters in property values

Special characters in property values are different from special characters in text.  

|Special character|Description|
|---|---|
|`\`|Character escape|
|<code>&#x7c;</code>|Column delimiter|
|`{`|Property delimiter (Start)|
|`}`|Property delimiter (End)|
|`:`|Key-value separator|
|`;`|Key-value delimiter|

### Escape sequences in property values

Escape special characters.  

|Escape sequence|Description|
|---|---|
|`\\`|&#x5c;|
|<code>&#x5c;&#x7c;</code>|&#x7c;|
|`\{`|&#x7b;|
|`\}`|&#x7d;|
|`\;`|&#x3b;|
|`\n`|New line|
|`\x`_nn_|Hexadecimal character code|
|`\`_char_ (Others)|Ignore|
