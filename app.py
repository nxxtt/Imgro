import PySimpleGUI as sg
import os
from PIL import Image, ImageTk

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
        
        base_filename = f"{name}_modificado"
        new_filename = f"{base_filename}{ext}"
        new_filepath = os.path.join(directory, new_filename)
        
        counter = 2
        while os.path.exists(new_filepath):
            new_filename = f"{base_filename}{counter}{ext}"
            new_filepath = os.path.join(directory, new_filename)
            counter += 1
        
        save_format = 'PNG' if ext == '.png' else 'JPEG'
        resized.save(new_filepath, format=save_format)
        
        return new_filepath

def load_preview(filepath, max_size=(350, 300)):
    with Image.open(filepath) as img:
        img.thumbnail(max_size, Image.LANCZOS)
        return ImageTk.PhotoImage(img)

def main():
    sg.theme('DarkGrey13')
    
    font_main = ('Segoe UI', 11)
    font_title = ('Segoe UI', 14, 'bold')
    font_small = ('Segoe UI', 9)
    
    layout = [
        [sg.Text('  REDIMENSIONADOR DE IMAGENS', font=font_title, text_color='#00B4D8', pad=((0, 0), (10, 15)))],
        
        [sg.Frame('Selecionar Imagem', [
            [sg.Input(key='-FILE-', size=(45, 1), enable_events=True, background_color='#2D2D2D', text_color='#FFFFFF'),
             sg.FileBrowse('📂', button_color=('#1A1A1A', '#00B4D8'), file_types=(('Imagens', '*.png;*.jpg;*.jpeg;*.bmp;*.gif'),))]
        ], background_color='#1E1E1E', title_color='#00B4D8', border_width=0, pad=((0, 0), (0, 10)))],
        
        [sg.Frame('Dimensões', [
            [sg.Text('Original:', font=font_small, text_color='#888888'),
             sg.Text('-', key='-ORIGINAL-', font=font_main, text_color='#00B4D8', size=(12, 1)),
             sg.Text('Nova:', font=font_small, text_color='#888888', pad=((20, 0), 0)),
             sg.Text('Largura:', font=font_small, text_color='#888888'),
             sg.InputText(key='-WIDTH-', size=(6, 1), background_color='#2D2D2D', text_color='#FFFFFF'),
             sg.Text('px', font=font_small, text_color='#888888'),
             sg.Text('Altura:', font=font_small, text_color='#888888', pad=((15, 0), 0)),
             sg.InputText(key='-HEIGHT-', size=(6, 1), background_color='#2D2D2D', text_color='#FFFFFF'),
             sg.Text('px', font=font_small, text_color='#888888')]
        ], background_color='#1E1E1E', title_color='#00B4D8', border_width=0, pad=((0, 0), (0, 10)))],
        
        [sg.Column([
            [sg.Button('▶ Redimensionar', key='-RESIZE-', disabled=True, button_color=('#1A1A1A', '#00B4D8'), font=font_main, size=(15, 1)),
             sg.Button('↺ Limpar', key='-CLEAR-', button_color=('#1A1A1A', '#6C757D'), font=font_main, size=(12, 1))]
        ], justification='center', pad=((0, 0), (0, 15)))],
        
        [sg.Frame('Preview', [
            [sg.Image(key='-IMAGE-', background_color='#1E1E1E')]
        ], background_color='#1E1E1E', title_color='#00B4D8', border_width=0, pad=((0, 0), (0, 10)))],
        
        [sg.Text('', key='-STATUS-', font=font_small, text_color='#28A745', justification='center', size=(50, 1))]
    ]
    
    window = sg.Window('Redimensionador', layout, finalize=True, background_color='#121212', element_justification='center')
    
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
                    window['-ORIGINAL-'].update(f'{w} x {h} px')
                    window['-RESIZE-'].update(disabled=False)
                    window['-STATUS-'].update(f'Formato: {fmt}')
                except Exception as e:
                    window['-STATUS-'].update(f'Erro: {str(e)}')
        
        elif event == '-RESIZE-':
            filepath = values['-FILE-']
            width = values['-WIDTH-']
            height = values['-HEIGHT-']
            
            if not filepath or not os.path.exists(filepath):
                window['-STATUS-'].update('Selecione uma imagem primeiro', text_color='#DC3545')
                continue
                
            if not width or not height:
                window['-STATUS-'].update('Informe largura e altura', text_color='#DC3545')
                continue
                
            try:
                width = int(width)
                height = int(height)
                
                if width <= 0 or height <= 0:
                    window['-STATUS-'].update('Dimensões devem ser positivas', text_color='#DC3545')
                    continue
                    
                new_path = resize_image(filepath, width, height)
                window['-STATUS-'].update(f'✅ Salvo: {os.path.basename(new_path)}', text_color='#28A745')
                
                current_preview = load_preview(new_path)
                window['-IMAGE-'].update(data=current_preview)
                
            except ValueError:
                window['-STATUS-'].update('Dimensões inválidas', text_color='#DC3545')
            except Exception as e:
                window['-STATUS-'].update(f'Erro: {str(e)}', text_color='#DC3545')
        
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