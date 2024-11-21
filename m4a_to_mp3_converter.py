import os
from pydub import AudioSegment

def convert_m4a_to_mp3(input_folder):
    if not os.path.isdir(input_folder):
        print(f"Error: {input_folder} is not a valid directory.")
        return

    # Create output folder for mp3 files
    output_folder = os.path.join(input_folder, "mp3_output")
    os.makedirs(output_folder, exist_ok=True)
    
    for filename in os.listdir(input_folder):
        if filename.endswith(".m4a"):
            file_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, filename.replace(".m4a", ".mp3"))
            
            try:
                print(f"Converting {filename} to mp3...")
                audio = AudioSegment.from_file(file_path, format="m4a")
                audio.export(output_path, format="mp3", bitrate="192k")
                print(f"Converted: {output_path}")
            except Exception as e:
                print(f"Failed to convert {filename}: {e}")

if __name__ == "__main__":
    input_folder = input("Enter the path to the folder containing m4a files: ").strip()
    convert_m4a_to_mp3(input_folder)