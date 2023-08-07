The Myoblast Fusion Index Determination Software
================================================

The Myofinder application aims to provide an open-source graphical interface 
for automatic calculation of the fusion index in muscle cell cultures, based on 
fluorescence microscopy images.

Presentation
------------

Myofinder is based on an Artificial Intelligence library for cell segmentation, 
that it makes easily accessible to researchers with limited computer skills.
In the interface, users can manage multiple images at once, 
<!-- adjust processing parameters,  -->
and manually correct the output of the computation. It is also 
possible to save the result of the processing as a project, that can be shared 
and re-opened later.

A more detailed description of the features and usage of Myofinder can be found 
in the 
[usage section](https://tissueengineeringlab.github.io/Myofinder/usage.html)
of the documentation.

Myofinder was developed by students of [KU Leuven](https://www.kuleuven.be/kuleuven/) university, which is then further refined by [Tissue Engineering Lab](https://tissueengineering.kuleuven-kulak.be/) in Kortrijk, Belgium, which is part of the [KU Leuven](https://www.kuleuven.be/kuleuven/) university. After this, I forked the project to update it even further. 

Requirements
------------

To run Myofinder, you only need to install the correct excutable for your OS (linux, windows, macOS). 
See the release branch. 

Installation
------------

1. Install the Tauri UI Application: 

Download the executable from the repository or the official release. You can install the application on your local machine.

2. Remote Server Setup: Deploy the Python code, which contains the computational prediction model, on the remote server. The server should expose an API endpoint to accept image data for processing and return the computed fusion index results in JSON format.

User Interaction Flow
---------------------

1. Launch the Tauri UI Application: Run the Tauri UI application on your local machine. The application will provide a user-friendly interface for image processing.

2. Upload Images: Use the Tauri UI interface to upload images for processing. The Tauri application will prepare the image data to be sent to the remote server.

3. Send Requests to Remote Server: When the "Process Images" button is clicked, the Tauri UI application makes requests to the remote server, passing the uploaded image data.

4. Process Images on Remote Server: The remote server receives the image data, processes it using the computational prediction model, and computes the fusion index.

5. Display Results: The results of the image processing are returned from the remote server to the Tauri UI application. The application displays the fusion index results to the user.

Security and Confidentiality
----------------------------

To ensure security and confidentiality of sensitive data, the remote server code can be run on site, on the servers of the your institution.  

I hope that the Myofinder software, with the separated UI and the remote server architecture, will provide an efficient and confidential solution for assessing the fusion index of cell populations using fluorescence microscopy images.
