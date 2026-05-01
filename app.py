import PySimpleGUI as sg
import os
from PIL import Image, ImageTk
import io

def get_image_properties(filepath):
    with Image.open(filepath) as img:
        return img.size[0], img.size[1], img.format

def resize_image(filepath, width, height):
    with Image.open(filepath) as img:
        resized = img.resize((width, height), Image.NEAREST)
        
        directory = os.path.dirname(filepath)
        basename = os.path.basename(filepath)
        name, ext = os.path.splitext(basename)
        ext = ext.lower()
        
        if not ext:
            ext = '.png' if img.format == 'PNG' else '.jpg'
        
        new_filename = f"{name}_modificado{ext}"
        new_filepath = os.path.join(directory, new_filename)
        
        save_format = 'PNG' if ext == '.png' else 'JPEG'
        resized.save(new_filepath, format=save_format)
        
        return new_filepath

def load_preview(filepath, max_size=(300, 300)):
    with Image.open(filepath) as img:
        img.thumbnail(max_size, Image.LANCZOS)
        return ImageTk.PhotoImage(img)

def main():
    sg.theme('LightGrey1')
    
    layout = [
        [sg.Text('Selecionar Imagem:'), sg.Input(key='-FILE-', size=(40, 1), enable_events=True), sg.FileBrowse('Procurar', file_types=(('Imagens', '*.png;*.jpg;*.jpeg;*.bmp;*.gif'),))],
        [sg.Text('Resolução Original:'), sg.Text('-', key='-ORIGINAL-', size=(15, 1)), sg.Text('Nova Largura:'), sg.InputText(key='-WIDTH-', size=(6, 1)), sg.Text('Nova Altura:'), sg.InputText(key='-HEIGHT-', size=(6, 1))],
        [sg.Button('Redimensionar', key='-RESIZE-', disabled=True), sg.Button('Limpar', key='-CLEAR-')],
        [sg.HorizontalSeparator()],
        [sg.Text('Preview:', key='-PREVIEW-'), sg.Image(key='-IMAGE-')],
        [sg.Text('', key='-STATUS-', size=(50, 1))]
    ]
    
    window = sg.Window('Redimensionador de Imagens', layout, finalize=True)
    
    current_preview = None
    
    while True:
        event, values = window.read()
        
        if event == sg.WINDOW_CLOSED:
            break
        
        if event == '-FILE-':
            filepath = values['-FILE-']
            if filepath and os.path.exists(filepath):
                try:
                    w, h, fmt = get_image_properties(filepath)
                    window['-ORIGINAL-'].update(f'{w} x {h}')
                    window['-RESIZE-'].update(disabled=False)
                    window['-STATUS-'].update(f'Formato: {fmt}')
                except Exception as e:
                    window['-STATUS-'].update(f'Erro: {str(e)}')
        
        elif event == '-RESIZE-':
            filepath = values['-FILE-']
            width = values['-WIDTH-']
            height = values['-HEIGHT-']
            
            if not filepath or not os.path.exists(filepath):
                window['-STATUS-'].update('Selecione uma imagem primeiro')
                continue
                
            if not width or not height:
                window['-STATUS-'].update('Informe largura e altura')
                continue
                
            try:
                width = int(width)
                height = int(height)
                
                if width <= 0 or height <= 0:
                    window['-STATUS-'].update('Dimensões devem ser positivas')
                    continue
                    
                new_path = resize_image(filepath, width, height)
                window['-STATUS-'].update(f'Salvo: {os.path.basename(new_path)}')
                
                current_preview = load_preview(new_path)
                window['-IMAGE-'].update(data=current_preview)
                
            except ValueError:
                window['-STATUS-'].update('Dimensões inválidas')
            except Exception as e:
                window['-STATUS-'].update(f'Erro: {str(e)}')
        
        elif event == '-CLEAR-':
            window['-FILE-'].update('')
            window['-WIDTH-'].update('')
            window['-HEIGHT-'].update('')
            window['-ORIGINAL-'].update('-')
            window['-IMAGE-'].update('')
            window['-STATUS-'].update('')
            window['-RESIZE-'].update(disabled=True)
            current_preview = None
    
    window.close()

if __name__ == '__main__':
    main()