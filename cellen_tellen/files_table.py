# coding: utf-8

from tkinter import ttk, Canvas, messagebox, Event, BooleanVar, Checkbutton, \
    PhotoImage
from xlsxwriter import Workbook
from shutil import copyfile, rmtree
from cv2 import polylines, ellipse, imwrite, cvtColor, COLOR_RGB2BGR
from pathlib import Path
from platform import system
from typing import List, Tuple
from copy import deepcopy
from functools import partial
from pickle import dump, load
from numpy import ndarray, array

from .tools import Nucleus, Fibre, Nuclei, Fibres, Labels, Lines, \
    Graphical_element, check_image, Check, Table_items, Table_entry

# Color codes used in the table
background = '#EAECEE'
background_selected = '#ABB2B9'
label_line = '#646464'
label_line_selected = 'black'


class Files_table(ttk.Frame):
    """This frame stores and displays the different images of the project.

    It also stores the nuclei and fibre count, and handles the saving of images
    and data.
    """

    def __init__(self,
                 root: ttk.Frame,
                 projects_path: Path,
                 main_window) -> None:
        """Sets the appearance of the frame.

        Args:
            root: The parent frame in which this one is included.
            projects_path: The path to the Projects folder.
            main_window: the main window of the GUI.
        """

        super().__init__(root)

        self._row_height = 50  # The height of a row in pixels
        self._projects_path = projects_path
        self._main_window = main_window

        # Setting the appearance
        self._set_layout()
        self._set_bindings()
        self._set_variables()

    def load_project(self, directory: Path) -> None:
        """Loads an existing project.

        Gets the images names and paths, the fibres positions, and the nuclei
        positions and colors from the data.pickle file.

        Args:
            directory: The path to the directory where the project to load is.
        """

        # First, resetting the project
        self.reset()

        # Loading the simple version of the stored data
        with open(directory / 'data.pickle', 'rb') as save_file:
            table_items = load(save_file)

        # Keeping only the data corresponding to existing images
        self.table_items = Table_items(
            entries=[entry for entry in table_items if
                     (directory / 'Original Images' / entry.path).is_file()])

        # Completing the paths to match that of the directory to load
        for entry in self.table_items:
            entry.path = directory / 'Original Images' / entry.path

        # Removing any reference to Tkinter objects
        for entry in self.table_items:
            for nucleus in entry.nuclei:
                nucleus.tk_obj = None
            for fibre in entry.fibres:
                fibre.polygon = None

        # Redrawing the canvas
        if self.table_items:
            self._make_table()

    def save_project(self, directory: Path, save_altered: bool) -> None:
        """Saves a project.

        Saves the images names and paths, the fibres positions, the nuclei
        positions and colors, the images themselves, a .xlsx file containing
        stats of the project, and optionally the images with nuclei and fibres
        drawn on it.

        Args:
            directory: The path to the directory where the project has to be
                saved.
            save_altered: Should the images with nuclei and fibres drawn be
                saved ?
        """

        # First, save the stats in a .xlsx file
        self._save_table(directory)

        # Then, save the original images
        self._save_originals(directory)

        # If needed, save the altered images
        if save_altered:
            self._save_altered_images(directory)

        # Finally, save the data
        self._save_data(directory)

    def add_nucleus(self, nucleus: Nucleus) -> None:
        """Adds a Nucleus to the Nuclei object associated with the current
        image.

        Args:
            nucleus: The Nucleus object to add.
        """

        self.table_items.current_entry.nuclei.append(deepcopy(nucleus))
        self._update_data(self.table_items.current_entry)

    def remove_nucleus(self, nucleus: Nucleus) -> None:
        """Removes a Nucleus from the Nuclei object associated with the current
        image.

        Args:
            nucleus: The Nucleus object to remove.
        """

        self.table_items.current_entry.nuclei.remove(nucleus)
        self._update_data(self.table_items.current_entry)

    def switch_nucleus(self, nucleus: Nucleus) -> None:
        """Switches the color of a nucleus.

        Args:
            nucleus: The Nucleus object whose color should be switched.
        """

        for nuc in self.table_items.current_entry.nuclei:
            if nuc == nucleus:
                nuc.color = 'out' if nuc.color == 'in' else 'in'
        self._update_data(self.table_items.current_entry)

    def reset(self) -> None:
        """Resets everything in the frame.

        Removes the existing images, as well as the nuclei and fibres.
        """

        # Deleting every element in the canvas
        for item in self._canvas.find_all():
            self._canvas.delete(item)

        # Deleting all the stored data
        self.table_items.reset()
        self._hovering_index = None

    def add_images(self, filenames: List[Path]) -> None:
        """Adds images to the current frame.

        The new images are added under the existing list of images.

        Args:
            filenames: A list containing the paths to the images to load.
        """

        # Deleting every element in the canvas
        for item in self._canvas.find_all():
            self._canvas.delete(item)

        # Making sure there's no conflict between the new and previous images
        for file in filenames:
            if file in self.table_items.file_names:
                messagebox.showerror("Error while loading files",
                                     f"The file {file.name} is already opened,"
                                     f"ignoring.")
                filenames.remove(file)
            elif file.name in [file_.name for file_
                               in self.table_items.file_names]:
                messagebox.showerror("Error while  loading files",
                                     f"A file with the same name ({file.name})"
                                     f"is already opened, ignoring.")
                filenames.remove(file)

        # Adding the new images to the frame
        for file in filenames:
            self.table_items.append(Table_entry(path=file,
                                                nuclei=Nuclei(),
                                                fibres=Fibres()))

        # Redrawing the canvas
        self._make_table()

    def input_processed_data(
            self,
            nuclei_negative_positions: List[Tuple[float, float]],
            nuclei_positive_positions: List[Tuple[float, float]],
            fibre_contours: Tuple[ndarray],
            area: float,
            file: Path) -> None:
        """Adds the nuclei and fibres positions to the frame after they've been
        computed.

        Args:
            nuclei_negative_positions: The positions of the nuclei outside the
                fibres.
            nuclei_positive_positions: The positions of the nuclei inside the
                fibres.
            fibre_contours: The positions of the contour points of the fibers.
            area: The ratio of fiber area over the total image area.
            file: The path to the file whose nuclei and fibres have been
                computed.
        """

        # Adds the received nuclei to the Nuclei object and draws them
        self.table_items[file].nuclei.reset()
        for x, y in nuclei_negative_positions:
            self.table_items[file].nuclei.append(Nucleus(x, y, None, 'out'))
        for x, y in nuclei_positive_positions:
            self.table_items[file].nuclei.append(Nucleus(x, y, None, 'in'))

        # Adds the received fibres to the Fibres object and draws them
        self.table_items[file].fibres.reset()
        self.table_items[file].fibres.area = area
        for contour in fibre_contours:
            contour = list(map(tuple, contour))
            self.table_items[file].fibres.append(Fibre(None, contour))

        # Updates the display
        self._update_data(self.table_items[file])

        # Refreshes the image display if necessary
        if file == self.table_items.current_path:
            self.image_canvas.load_image(
                self.table_items.current_path,
                self.table_items.current_entry.nuclei,
                self.table_items.current_entry.fibres)

    def enable_buttons(self, enable: bool) -> None:
        """Enables or disables the close buttons and checkboxes of the images.

        They should be disabled when the program is computing, as the images
        shouldn't be removed at this moment.

        Args:
            enable: Whether the buttons should be enabled or disabled.
        """

        button_state = 'enabled' if enable else 'disabled'
        check_state = 'normal' if enable else 'disabled'

        for entry in self.table_items:
            entry.graph_elt.button['state'] = button_state
            entry.graph_elt.check.box['state'] = check_state

    @property
    def all_checked(self) -> bool:
        """Returns True when all the checkboxes of the images are set."""

        # If there's no image, default is True
        if not self.table_items:
            return True

        return all(entry.graph_elt.check.var.get() for entry
                   in self.table_items)

    @property
    def checked_files(self) -> List[Path]:
        """Returns the paths to the files whose checkboxes are checked."""

        return [entry.path for entry in self.table_items
                if entry.graph_elt.check.var.get()]

    def delete_image(self, file: Path, security: bool = True) -> None:
        """Removes an image from the canvas.

        Args:
            file: The path to the image to be removed.
            security: If True, no warning message is displayed before
                deleting the file.
        """

        # Security to prevent unwanted deletions
        if security:
            ret = messagebox.askyesno('Hold on !',
                                      f"Do you really want to remove "
                                      f"{file.name} ?\nAll the unsaved data "
                                      f"will be lost.")
            if not ret:
                return

        # Un-hovering the current entry, which should be the one to delete
        if self._hovering_index is not None:
            self._un_hover(self._hovering_index)
            self._hovering_index = None

        # Cleaning the canvas
        for item in self._canvas.find_all():
            self._canvas.delete(item)

        # Removing any reference to the image being deleted
        index = self.table_items.index(file)
        self.table_items.remove(file)

        # If there's no entry left in the canvas
        if not self.table_items:
            self.table_items.current_path = None
            self._hovering_index = None

        # Selecting the new current image in case it was the one to delete
        elif self.table_items.current_path == file:
            try:
                self.table_items.current_path = self.table_items.\
                    entries[index].path
            except IndexError:
                self.table_items.current_path = self.table_items.\
                    entries[index - 1].path

        # Re-drawing the canvas
        self._make_table()

        # Updating the master checkbox
        self._main_window.update_master_check()

    def _save_data(self, directory: Path) -> None:
        """Saves the names of the images, the positions of the fibres and the
        positions and colors of the nuclei.

        All this information is stored in a data.pickle file.

        Args:
            directory: The directory where the file should be saved.
        """

        with open(directory / 'data.pickle', 'wb+') as save_file:
            dump(self.table_items.save_version, save_file, protocol=4)

    def _save_originals(self, directory: Path) -> None:
        """Saves the original images in a sub-folder of Cellen-Tellen's Project
        folder.

        Args:
            directory: The path to the project folder.
        """

        # Creating the directory if it doesn't exit
        if not (directory / 'Original Images').is_dir():
            Path.mkdir(directory / 'Original Images')

        # Actually saving the images
        for item in self.table_items:
            # Saving only if the images are not saved yet
            if self._projects_path not in item.path.parents:
                new_path = directory / 'Original Images' / item.path.name

                # Handling the case when the image cannot be loaded
                try:
                    copyfile(item.path, new_path)
                except FileNotFoundError:
                    messagebox.showerror(f'Error while saving the image !',
                                         f'Check that the image at '
                                         f'{item.path} still exists and '
                                         f'that it is accessible.')
                    continue

                # Updating the current image path if necessary
                if self.table_items.current_path == item.path:
                    self.table_items.current_path = new_path

                # Changing the saved path for the image
                item.path = new_path

    def _save_table(self, directory: Path) -> None:
        """Saves a .xlsx file containing stats about the images of the project.

        Args:
            directory: The path to the project folder.
        """

        # Creating the Excel file
        workbook = Workbook(str(directory / str(directory.name + '.xlsx')))
        worksheet = workbook.add_worksheet()

        # Bold style for a nicer layout
        bold = workbook.add_format({'bold': True, 'align': 'center'})

        # Writing the labels
        worksheet.write(0, 0, "Image names", bold)
        worksheet.write(0, 1, "Total number of nuclei", bold)
        worksheet.write(0, 2, "Number of tropomyosin positive nuclei", bold)
        worksheet.write(0, 3, "Fusion index", bold)
        worksheet.write(0, 4, "Fiber area ratio", bold)

        # Setting the column widths
        worksheet.set_column(
            0, 0, width=max(11, max(len(file.name) for file
                                    in self.table_items.file_names)
                            if self.table_items else 0))
        worksheet.set_column(1, 1, width=22)
        worksheet.set_column(2, 2, width=37)
        worksheet.set_column(3, 3, width=17)
        worksheet.set_column(4, 4, width=16)

        for i, item in enumerate(self.table_items):
            # Writing the names of the images
            worksheet.write(i + 2, 0, item.path.name)

            # Writing the total number of nuclei
            worksheet.write(i + 2, 1, len(item.nuclei))

            # Writing the number of nuclei in fibres
            worksheet.write(i + 2, 2, item.nuclei.nuclei_in_count)

            # Writing the ratio of nuclei in over the total number of nuclei
            if item.nuclei.nuclei_out_count > 0:
                worksheet.write(i + 2, 3, item.nuclei.nuclei_in_count /
                                len(item.nuclei))
            else:
                worksheet.write(i + 2, 3, 'NA')

            # Writing the percentage area of fibres
            worksheet.write(i + 2, 4, f'{item.fibres.area * 100:.2f}')

        # Writing the average for each column
        average_line = 3 + len(self.table_items)
        last_data_line = 2 + len(self.table_items)
        worksheet.write(average_line, 0, "Average", bold)
        if self.table_items:
            worksheet.write(average_line, 1, f"=AVERAGE(B3:B{last_data_line})")
            worksheet.write(average_line, 2, f"=AVERAGE(C3:C{last_data_line})")
            worksheet.write(average_line, 3, f"=AVERAGE(D3:D{last_data_line})")
            worksheet.write(average_line, 4, f"=AVERAGE(E3:E{last_data_line})")

        workbook.close()

    def _save_altered_images(self, directory: Path) -> None:
        """Saves the images with the nuclei and fibres drawn on them.

        Args:
            directory: The path to the project folder.
        """

        # Creates the directory if it doesn't exist yet
        if (directory / 'Altered Images').is_dir():
            rmtree(directory / 'Altered Images')
        Path.mkdir(directory / 'Altered Images')

        # Saves the images
        for entry in self.table_items:
            self._draw_nuclei_save(entry, directory)

    def _draw_nuclei_save(self,
                          entry: Table_entry,
                          project_name: Path) -> None:
        """Draws fibres and nuclei on an images and then saves it.

        Args:
            entry: The table entry whose image to save.
            project_name: The path to the project folder.
        """

        color_to_bgr = {'blue': (255, 0, 0),
                        'green': (0, 255, 0),
                        'red': (0, 0, 255),
                        'yellow': (0, 255, 255),
                        'cyan': (255, 255, 0),
                        'magenta': (255, 0, 255),
                        'black': (0, 0, 0),
                        'white': (255, 255, 255),
                        '#FFA500': (0, 165, 255),
                        '#32CD32': (50, 205, 50),
                        '#646464': (100, 100, 100)}

        # Reads the image
        cv_img = check_image(project_name / "Original Images" /
                             entry.path.name)
        cv_img = cvtColor(cv_img, COLOR_RGB2BGR)

        # Aborting if the image cannot be loaded
        if cv_img is None:
            return

        # Drawing the fibres
        for fib in entry.fibres:
            positions = array(fib.position)
            positions = positions.reshape((-1, 1, 2))
            polylines(cv_img, [positions], True,
                      color_to_bgr[self.image_canvas.fib_color], 4)

        # Drawing the nuclei
        for nuc in entry.nuclei:
            centre = (int(nuc.x_pos), int(nuc.y_pos))
            if nuc.color == 'out':
                ellipse(cv_img, centre, (6, 6), 0, 0, 360,
                        color_to_bgr[self.image_canvas.nuc_col_out], -1)
            else:
                ellipse(cv_img, centre, (6, 6), 0, 0, 360,
                        color_to_bgr[self.image_canvas.nuc_col_in], -1)

        # Now saving the image
        imwrite(str(project_name / "Altered Images" / entry.path.name), cv_img)

    def _set_layout(self) -> None:
        """Sets the layout of the frame by creating the canvas and the
        scrollbar."""

        self.pack(expand=True, fill="both", anchor="n", side='top')

        # Creating the canvas
        self._canvas = Canvas(self, bg='#FFFFFF',
                              highlightbackground='black',
                              highlightthickness=3)
        self._canvas.configure(scrollregion=self._canvas.bbox('all'))
        self._canvas.pack(expand=True, fill="both", anchor="w", side='left',
                          pady=5)

        # Creating the scrollbar
        self._vbar = ttk.Scrollbar(self, orient="vertical")
        self._vbar.pack(side='right', fill='y', pady=5)
        self._vbar.config(command=self._canvas.yview)
        self._canvas.config(yscrollcommand=self._vbar.set)

        self.update()

    def _set_bindings(self) -> None:
        """Sets the actions associated with the user inputs."""

        # Different wheel management in Windows and Linux
        if system() == "Linux":
            self._canvas.bind('<4>', self._on_wheel)
            self._canvas.bind('<5>', self._on_wheel)
        else:
            self._canvas.bind('<MouseWheel>', self._on_wheel)

        self._canvas.bind('<ButtonPress-1>', self._left_click)
        self._canvas.bind_all('<Motion>', self._motion)

    def _set_variables(self) -> None:
        """Method to centralize the instantiation of the attributes."""

        # Attributes managing the display
        self._hovering_index = None

        # Other attributes
        self.image_canvas = None

        self.table_items = Table_items()

    def _on_wheel(self, event: Event) -> None:
        """Scrolls the canvas up or down upon wheel motion."""

        # Different wheel management in Windows and Linux
        if system() == "Linux":
            delta = 1 if event.num == 4 else -1
        else:
            delta = int(event.delta / abs(event.delta))

        # Don't move if there are too few images
        if self._table_height > self._canvas.winfo_height():
            self._canvas.yview_scroll(-delta, "units")

    def _update_data(self, entry: Table_entry) -> None:
        """Updates the display when data about an image has changed.

        Args:
            entry: The path to the image whose data should be updated.
        """

        # To avoid repeated calls to the same attribute
        nuclei = entry.nuclei
        fibres = entry.fibres
        items = entry.graph_elt
        total_nuclei = len(nuclei)

        # Updating the labels
        self._canvas.itemconfig(items.labels.nuclei,
                                text='Total : ' + str(total_nuclei))
        self._canvas.itemconfig(
            items.labels.positive,
            text='Positive : ' + str(nuclei.nuclei_in_count))
        if total_nuclei > 0:
            self._canvas.itemconfig(
                items.labels.ratio,
                text=f'Ratio : '
                     f'{int(100 * nuclei.nuclei_in_count / total_nuclei)}%')
        else:
            self._canvas.itemconfig(items.labels.ratio,
                                    text='Ratio : NA')
        self._canvas.itemconfig(
            items.labels.fiber,
            text='Fibre area : ' + f'{int(fibres.area * 100)}%')

    def _motion(self, event: Event) -> None:
        """Modifies the display when the mose is being hovered over the
        canvas."""

        if self.table_items:
            # Case when the mouse is on the canvas
            if 0 < self._canvas.canvasy(event.y) < self._table_height and \
                    event.widget == self._canvas:
                index = int(self._canvas.canvasy(event.y) /
                            (self._row_height * 2))
                # Modifying the current item only if a new one was hovered
                if index != self._hovering_index:
                    if self._hovering_index is not None:
                        self._un_hover(self._hovering_index)
                    self._hover(index)

            # Case when the mouse is not on the canvas
            elif self._hovering_index is not None:
                # Simply un-hovering the current item if any
                self._un_hover(self._hovering_index)
                self._hovering_index = None

    def _hover(self, index: int) -> None:
        """Highlights a canvas entry that is being hovered.

        Args:
            index: The index of the entry to highlight in the index_to_img
                dict.
        """

        self._hovering_index = index
        self._set_aesthetics(index, selected=True, hover=True)

    def _un_hover(self, index: int) -> None:
        """Un-highlights a canvas entry that is not hovered anymore.

        Args:
            index: The index of the entry to un-highlight in the index_to_img
                dict.
        """

        if index != self.table_items.current_index:
            self._set_aesthetics(index, selected=False, hover=True)

    def _unselect_image(self, index: int) -> None:
        """Un-selects an image in the canvas."""

        self._set_aesthetics(index, selected=False, hover=False)

    def _select_image(self, index: int) -> None:
        """Selects an image in the canvas.

        This image is re-loaded.
        """

        entry = self.table_items.entries[index]
        self.image_canvas.load_image(entry.path, entry.nuclei, entry.fibres)
        self.table_items.current_path = entry.path
        self._set_aesthetics(index, selected=True, hover=False)

    def _set_aesthetics(self,
                        index: int,
                        selected: bool,
                        hover: bool) -> None:
        """Sets the display of the canvas when loading or selecting images, or
        when hovering.

        Args:
            index: The index of the entry being (un)hovered or (un)selected in
                the index_to_img dict.
            selected: True when hovering or selecting, False when un-hovering
                or un-selecting.
            hover: True when (un)hovering, False when (un)selecting.
        """

        # Different color sets when selected or not
        line_color = label_line_selected if selected else label_line
        rect_color = background_selected if selected else background

        items = self.table_items.entries[index].graph_elt

        # Cannot set the upper line if first entry in canvas
        if index > 0:
            self._canvas.itemconfig(self.table_items.entries[index].graph_elt.
                                    lines.full_line, fill=line_color)

        # The rectangle isn't affected by hovering
        if not hover:
            self._canvas.itemconfig(items.rect, fill=rect_color)

        # Setting all the items of the entry
        self._canvas.itemconfig(items.lines.half_line, fill=line_color)
        self._canvas.itemconfig(items.lines.full_line, fill=line_color)
        self._canvas.itemconfig(items.lines.index_line, fill=line_color)

        self._canvas.itemconfig(items.labels.name, fill=line_color)
        self._canvas.itemconfig(items.labels.nuclei, fill=line_color)
        self._canvas.itemconfig(items.labels.ratio, fill=line_color)
        self._canvas.itemconfig(items.labels.positive, fill=line_color)
        self._canvas.itemconfig(items.labels.index, fill=line_color)
        self._canvas.itemconfig(items.labels.fiber, fill=line_color)

    def _left_click(self, event: Event) -> None:
        """Selects a new image or reloads the current."""

        # Does nothing if clicking in a blank area
        if self._canvas.canvasy(event.y) < self._table_height:
            # Unselects previous image
            self._unselect_image(self.table_items.current_index)

            # Selects new image
            self._select_image(int(self._canvas.canvasy(event.y) /
                                   (self._row_height * 2)))

    @property
    def _table_height(self) -> int:
        """The height of all the canvas entries in pixels."""

        return self._row_height * 2 * len(self.table_items)

    def _make_table(self) -> None:
        """Draws the entire canvas."""

        width = self._canvas.winfo_width()
        # The canvas is built iteratively
        for i, entry in enumerate(self.table_items):
            # Defining the top, middle and bottom position
            top = 2 * i * self._row_height
            middle = (2 * i + 1) * self._row_height
            bottom = (2 * i + 2) * self._row_height

            # Drawing the horizontal lines
            half_line = self._canvas.create_line(
                -1, middle, width, middle, width=1, fill=label_line)
            full_line = self._canvas.create_line(
                -1, bottom, width, bottom, width=3, fill=label_line)

            # Creating the button for removing the file
            button = ttk.Button(self._canvas, text="X", width=2,
                                command=partial(self.delete_image, entry.path))
            self._canvas.create_window(width - 17, top + 16, window=button)

            # Creating the checkbox for processing or not the image
            check_var = BooleanVar(self._canvas, True)
            img = PhotoImage(width=1, height=1)
            checkbox = Checkbutton(
                self._canvas, variable=check_var,
                image=img, width=6, height=24,
                command=self._main_window.update_master_check)
            self._canvas.create_window(width - 47, top + 16, window=checkbox)

            # Drawing the rectangle
            rect = self._canvas.create_rectangle(
                -1, top, width, bottom, fill=background)
            self._canvas.tag_lower(rect)  # lower it (background)

            # Setting the index
            index_text = self._canvas.create_text(
                25, top + int(self._row_height / 2),
                text=str(i + 1), anchor='center',
                font=('Helvetica', 10, 'bold'), fill=label_line)
            index_line = self._canvas.create_line(
                50, top, 50, middle, width=1, fill=label_line)

            # Setting the file name
            file_name = entry.path.name
            if len(file_name) >= 39:
                file_name = '...' + file_name[-36:]

            # Setting the text
            padding = 10
            name_text = self._canvas.create_text(
                54, top + int(self._row_height / 4),
                text=file_name, anchor='nw', fill=label_line,
                width=width - 117)
            nuclei_text = self._canvas.create_text(
                padding, middle + int(self._row_height / 4),
                text='error', anchor='nw', fill=label_line)
            positive_text = self._canvas.create_text(
                (width - 2 * padding) / 4 - padding / 2,
                middle + int(self._row_height / 4),
                text='error', anchor='nw', fill=label_line)
            ratio_text = self._canvas.create_text(
                (width - 2 * padding) * 2 / 4,
                middle + int(self._row_height / 4),
                text='error', anchor='nw', fill=label_line)
            fiber_text = self._canvas.create_text(
                (width - 2 * padding) * 3 / 4,
                middle + int(self._row_height / 4),
                text='error', anchor='nw', fill=label_line)

            # Adding the drawn objects to the items dict
            entry.graph_elt = Graphical_element(Labels(name_text,
                                                       nuclei_text,
                                                       positive_text,
                                                       ratio_text,
                                                       index_text,
                                                       fiber_text),
                                                Lines(half_line,
                                                      full_line,
                                                      index_line),
                                                rect,
                                                button,
                                                Check(checkbox,
                                                      check_var,
                                                      img))

            # Updating the displayed text according to the data
            self._update_data(entry)

        # Setting the scroll region
        self._canvas.config(scrollregion=(0, 0, width, self._table_height))

        # Highlighting the selected image
        if self.table_items:
            if self.table_items.current_path is None:
                self.table_items.current_path = self.table_items.\
                    entries[0].path
            self._select_image(self.table_items.current_index)
        else:
            self.image_canvas.reset()
