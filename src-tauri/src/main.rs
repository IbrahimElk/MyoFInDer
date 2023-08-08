// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use std::fs;
use std::io::Read;
use std::path::Path;
use std::collections::HashMap;

#[derive(Debug,Serialize,Deserialize)]
struct NucleusJSON {
    Xpos: f64,
    Ypos: f64,
    id: f64,
    r#type: f64,
}

#[derive(Debug,Serialize,Deserialize)]
struct FiberJSON {
    area: f64,
    fiberPath: Vec<(f64, f64)>,
    id: f64,
}

#[derive(Debug,Serialize,Deserialize)]
struct ImageData {
    nameImage: String,
    dataUrlBase64: String,
    FiberData: Vec<FiberJSON>,
    NucleiData: Vec<NucleusJSON>,
}

#[derive(Debug, Serialize,Deserialize)]
struct Data {
    title: String,
    data: HashMap<String, ImageData>,
}

// -----------------------------------------------------------
// -----------------------------------------------------------

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            send_and_receive,
            save,
            load
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ----------------------------------------------------------------------------------------------------
// SEND AND RECEIVE COMMAND
// ----------------------------------------------------------------------------------------------------

/// Asynchronous function to send a JSON string to a server and receive a response.
/// The function takes a `String` as input and returns the server's response as a `String`.
/// If an error occurs during the communication with the server, an empty `String` is returned.
#[tauri::command]
async fn send_and_receive(input: String) -> String {
    match send_and_receive_from_server(input).await {
        Ok(response) => String::from_utf8_lossy(&response).to_string(),
        Err(_) => String::new(),
    }
}
/// Asynchronous function to send a JSON string to a server and receive a response.
/// If successful, it returns `Ok(Vec<u8>)`, otherwise it returns an `Err` containing a boxed `dyn std::error::Error`.
async fn send_and_receive_from_server(json_data: String) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let server_address = "127.0.0.1:8000";
    let mut stream = TcpStream::connect(server_address).await?;
    send(json_data, &mut stream).await?;
    read(&mut stream).await
}

/// Asynchronous function to send data to a TCP stream.
/// It returns a `Result` containing `()` if successful or an `Err` containing a boxed `dyn std::error::Error`.
async fn send(json_data: String, stream: &mut TcpStream) -> Result<(), Box<dyn std::error::Error>> {
    stream.write_all(json_data.as_bytes()).await?;
    stream.write_all("EOF".as_bytes()).await?;
    Ok(())
}

/// Asynchronous function to read data from a TCP stream until an "EOF" marker is encountered.
/// If successful, it returns `Ok(Vec<u8>)`, otherwise it returns an `Err` containing a boxed `dyn std::error::Error`.
async fn read(stream: &mut TcpStream) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let mut buffer = Vec::new();
    loop {
        let mut chunk = vec![0; 4096];
        let bytes_read = stream.read(&mut chunk).await?;
        if bytes_read == 0 {
            break;
        }
        buffer.extend_from_slice(&chunk[..bytes_read]);

        if let Some(eof_index) = buffer.windows("EOF".as_bytes().len()).position(|window| window == "EOF".as_bytes()) {
            buffer.truncate(eof_index);
            break;
        }
    }
    Ok(buffer)
}

// ----------------------------------------------------------------------------------------------------
// STORE COMMAND
// ----------------------------------------------------------------------------------------------------

/// Saves project data to the specified project path.
/// 
/// This function is a Tauri command handler that saves project-related data to the specified `project_path`.
/// The data includes a CSV file, a binary file, and image files stored in the `data` object.
/// 
/// # Arguments
/// 
/// * `project_path`: A string slice (`&str`) representing the path to the project folder where data will be saved.
/// * `csv_data`: A string slice (`&str`) containing the CSV data to be saved in a file.
/// * `data`: A `Data` object containing project data, including title and image data to be saved.
/// 
#[tauri::command]
fn save(project_path: &str, csv_data: &str, data: Data) {
    let existing = Path::new(&project_path).exists();

    if !existing {
        fs::create_dir_all(&project_path).unwrap();
    }

    let csv_path = format!("{}/{}.csv", &project_path, data.title);
    fs::write(&csv_path, csv_data).unwrap();

    let binary_path = format!("{}/{}.bin", &project_path, data.title);
    
    let stringified_DATA = serde_json::to_string(&data).unwrap();
    let binary_data = stringified_DATA.as_bytes();
    fs::write(&binary_path, &binary_data).unwrap();

    let image_folder_path = format!("{}/images/", &project_path);
    extract_and_save_images(&image_folder_path, &data);
}

/// Extracts and saves images from the `save_data` object to the specified `folder_path`.
/// 
/// This function takes a `folder_path` where the images will be saved and a `save_data` object
/// containing image data. It creates the "images" folder if it doesn't exist and then loops through
/// the `save_data` object to extract and save each image.
/// 
/// The `save_data` object is expected to be of type `Data`, which is a custom struct or enum that
/// contains information about the images to be saved.
/// 
/// # Arguments
/// 
/// * `folder_path`: A string slice (`&str`) representing the path to the folder where the images will be saved.
/// * `save_data`: A reference to a `Data` object containing image data to be extracted and saved.
///
fn extract_and_save_images(folder_path: &str, save_data: &Data) {
    // Create the "images" folder if it doesn't exist
    if !Path::new(folder_path).exists() {
        fs::create_dir(folder_path).unwrap();
    }

    // Loop through the data object and extract image data
    for (image_id, image_data) in &save_data.data {
        let name_image = &image_data.nameImage;
        let data_url_base64 = &image_data.dataUrlBase64;

        // Convert base64 string to binary
        let base64_data = data_url_base64.replace("data:image/png;base64,", "");
        let binary_data = base64_data.as_bytes();

        let image_path = format!("{}{}", folder_path, name_image);
        fs::write(&image_path, binary_data).unwrap();
    }
}

// ----------------------------------------------------------------------------------------------------
// LOAD COMMAND
// ----------------------------------------------------------------------------------------------------

/// Reads binary data from a file specified by the given `full_path`.
/// 
/// This function opens the file located at `full_path` and reads its entire content as binary data.
/// The binary data is returned as a `Vec<u8>` (a vector of bytes).
/// 
/// ```
/// let file_path = "path/to/your/file.bin";
/// let binary_data = load(file_path);
/// // Use the binary_data as needed.
/// ```
#[tauri::command]
fn load(full_path: &str) -> Vec<u8> {
    let mut loaded_binary = Vec::new();
    if let Ok(mut file) = fs::File::open(full_path) {
        file.read_to_end(&mut loaded_binary).unwrap_or_default();
    }
    return loaded_binary;
}