# Redimensionador de Imagens

Aplicação para redimensionar imagens para qualquer resolução (pode distorcer).

## Instalação

```bash
cd C:\Users\Osvaldo\Desktop\modificador_resolucao
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Como Usar

```bash
python app.py
```

1. Clique em "Procurar" e selecione uma imagem
2. Informe a nova largura e altura em pixels
3. Clique em "Redimensionar"
4. A imagem será salva na mesma pasta com sufixo `_modificado`

## Formato de Saída

- Preserva o formato original (jpg→jpg, png→png)
- Nome do arquivo: `{nome_original}_modificado.{extensao}`

## Requisitos

- Python 3.7+
- Windows