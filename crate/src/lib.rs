extern crate wee_alloc;
use crate::utils::{copy_2d, count, random_bool};
use wasm_bindgen::prelude::*;
mod utils;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Universe {
    cols: usize,
    rows: usize,
    source: Vec<bool>,
    target: Vec<bool>,
    image_data: Vec<u8>,
    killed_cells: u32,
    resurrected_cells: u32,
    survive_rules: u16,
    resurrect_rules: u16,
    swap: bool,
}

#[wasm_bindgen]
impl Universe {
    /// Creates a new game-of-life universe
    pub fn new(mut rows: usize, mut cols: usize) -> Universe {
        // Bit-map with (r, g, b, a) values
        let image_size = (rows * cols) * 4;
        let mut image_data: Vec<u8> = (0..image_size).map(|_| 255 as u8).collect();

        // Add padding
        cols += 2;
        rows += 2;

        let total_cells = cols * rows;
        let target: Vec<bool> = (0..total_cells).map(|_| false).collect();
        let mut source: Vec<bool> = (0..total_cells).map(|_| false).collect();

        // Random initialization
        let mut resurrected_cells = 0;
        for row in 1..(rows - 1) {
            let image_data_offset = (row - 1) * (cols - 2);
            let offset = row * cols;

            for col in 1..(cols - 1) {
                if random_bool(0.5) {
                    source[offset + col] = true;

                    // Toggle pixel
                    let image_data_index = (image_data_offset + (col - 1)) * 4;
                    image_data[image_data_index] = 0;
                    image_data[image_data_index + 1] = 0;
                    image_data[image_data_index + 2] = 0;
                    resurrected_cells += 1;
                }
            }
        }

        Universe {
            swap: false,
            survive_rules: 0b000001100,
            resurrect_rules: 0b000001000,
            killed_cells: 0,
            resurrected_cells,
            image_data,
            cols,
            rows,
            source,
            target,
        }
    }

    pub fn resize(&mut self, rows: usize, cols: usize) {
        self.resurrected_cells = 0;
        self.killed_cells = 0;

        // Create new image bit-map and copy current one into it
        let new_image_size = (rows * cols) * 4;
        let mut new_image_data: Vec<u8> = (0..new_image_size).map(|_| 255 as u8).collect();

        copy_2d(
            &mut self.image_data,
            &mut new_image_data,
            (self.cols - 2) * 4,
            cols * 4,
            4,
            0,
        );

        // Create new source-cell-map and copy current source into it
        let new_rows = rows + 2;
        let new_cols = cols + 2;
        let total_cells = new_cols * new_rows;

        let current_source = if self.swap {
            &self.target
        } else {
            &self.source
        };

        let mut new_source: Vec<bool> = (0..total_cells).map(|_| false).collect();
        copy_2d(current_source, &mut new_source, self.cols, new_cols, 1, 1);

        // Calculate difference of how many cells died / were added compared to the previous state
        let prev_alive = count(current_source, true);
        let now_alive = count(&new_source, true);

        if now_alive < prev_alive {
            self.killed_cells = prev_alive - now_alive;
        }

        self.swap = false; // Un-swap arrays
        self.rows = new_rows;
        self.cols = new_cols;
        self.source = new_source;
        self.target = (0..total_cells).map(|_| false).collect();
        self.image_data = new_image_data;
    }

    pub fn next_gen(&mut self) {
        let image_data = &mut self.image_data;
        self.resurrected_cells = 0;
        self.killed_cells = 0;

        let (src, tar) = if self.swap {
            (&mut self.target, &mut self.source)
        } else {
            (&mut self.source, &mut self.target)
        };

        // Swap source and target array
        self.swap = !self.swap;

        let mut mask: u16;
        for row in 1..(self.rows - 1) {
            let image_data_offset = (row - 1) * (self.cols - 2);
            let top = (row - 1) * self.cols + 1;
            let middle = row * self.cols + 1;
            let bottom = (row + 1) * self.cols + 1;

            // Build 3x3 bit mask, the mask contains the state of the three cells
            // Below and above the current row.
            // TL TM X << X will be updated at each iteration (and others shifted to left)
            // ML MM X
            // BL BM X
            mask = (src[top - 1] as u16 * 32)
                + (src[top] as u16 * 4)
                + (src[middle - 1] as u16 * 16)
                + (src[middle] as u16 * 2)
                + (src[bottom - 1] as u16 * 8)
                + (src[bottom] as u16 * 1);

            // TODO: Bug, some cells stay white forever
            for col in 1..(self.cols - 1) {
                // Shift previously saved information to the left and make room
                // For 3 additional bits (which will be used for the middle row).
                mask = ((mask << 3) & 0b111111111)  // Make room for three more bits
                    + (src[top + col] as u16 * 4) // TR
                    + (src[middle + col] as u16 * 2)  // MR
                    + (src[bottom + col] as u16 * 1); // BR

                // Count amount of living neighbors
                let neighbors = (mask & 0b1)
                    + (mask >> 1 & 0b1)
                    + (mask >> 2 & 0b1)
                    + (mask >> 3 & 0b1)
                    + (mask >> 5 & 0b1)
                    + (mask >> 6 & 0b1)
                    + (mask >> 7 & 0b1)
                    + (mask >> 8 & 0b1)
                    + (mask >> 9 & 0b1);

                let cell_index = middle + col - 1;
                let cell = src[cell_index];

                let next = if cell {
                    (1 << neighbors) & self.survive_rules != 0
                } else {
                    (1 << neighbors) & self.resurrect_rules != 0
                };

                // Save state
                tar[cell_index] = next;

                // Save pixel
                let pixel_index = (image_data_offset + (col - 1)) * 4;

                if cell != next {
                    match next {
                        true => {
                            self.resurrected_cells += 1;
                            image_data[pixel_index] = 0;
                            image_data[pixel_index + 1] = 255;
                            image_data[pixel_index + 2] = 0;
                        }
                        false => {
                            self.killed_cells += 1;
                            image_data[pixel_index] = 255;
                            image_data[pixel_index + 1] = 255;
                            image_data[pixel_index + 2] = 255;
                        }
                    };
                } else if next {
                    // The color of the cell determines its age.
                    // It goes from green over blue / turquoise to red
                    let (r, g, b) = (
                        image_data[pixel_index],
                        image_data[pixel_index + 1],
                        image_data[pixel_index + 2],
                    );

                    if r == 0 && g == 255 && b < 255 {
                        image_data[pixel_index + 2] += 3;
                    } else if r == 0 && g > 0 && b == 255 {
                        image_data[pixel_index + 1] -= 3;
                    } else if r < 255 && g == 0 && b == 255 {
                        image_data[pixel_index] += 3;
                    } else if r == 255 && g == 0 && b > 0 {
                        image_data[pixel_index + 2] -= 3;
                    }
                }
            }
        }
    }

    pub fn load(&mut self, data: &[u8], cols: usize) {
        self.resurrected_cells = 0;
        self.killed_cells = 0;

        let (src, tar) = if self.swap {
            (&mut self.target, &mut self.source)
        } else {
            (&mut self.source, &mut self.target)
        };

        // Copy content
        let source = Vec::from(data)
            .iter()
            .map(|v| *v == 1)
            .collect::<Vec<bool>>();
        copy_2d(&source, tar, cols + 2, self.cols, 1, 0);

        // Swap arrays
        self.swap = !self.swap;

        // Repaint / update pixels
        for row in 1..(self.rows - 1) {
            let image_data_offset = (row - 1) * (self.cols - 2);
            let middle = row * self.cols + 1;

            for col in 1..(self.cols - 1) {
                let pixel_index = (image_data_offset + (col - 1)) * 4;
                let cell_index = middle + col - 1;

                self.image_data[pixel_index + 1] = 255;
                match tar[cell_index] {
                    true => {
                        self.image_data[pixel_index] = 0;
                        self.image_data[pixel_index + 2] = 0;

                        if !src[cell_index] {
                            self.resurrected_cells += 1;
                        }
                    }
                    false => {
                        self.image_data[pixel_index] = 255;
                        self.image_data[pixel_index + 2] = 255;

                        if src[cell_index] {
                            self.killed_cells += 1;
                        }
                    }
                };
            }
        }
    }

    pub fn image_data(&self) -> *const u8 {
        self.image_data.as_ptr()
    }

    pub fn image_size(&self) -> usize {
        self.image_data.len()
    }

    pub fn current_gen(&mut self) -> *const bool {
        (if self.swap {
            &self.target
        } else {
            &self.source
        })
        .as_ptr()
    }

    pub fn cell_count(&self) -> u32 {
        (self.rows * self.cols) as u32
    }

    pub fn killed_cells(&self) -> u32 {
        self.killed_cells
    }

    pub fn resurrected_cells(&self) -> u32 {
        self.resurrected_cells
    }

    pub fn set_ruleset(&mut self, resurrect: u16, survive: u16) {
        self.resurrect_rules = resurrect;
        self.survive_rules = survive;
    }

    pub fn set_cell(&mut self, x: usize, y: usize, state: bool) {
        let pixel_index = (y * (self.cols - 2) + x) * 4;

        // Update pixel
        self.image_data[pixel_index] = if state { 0 } else { 255 };
        self.image_data[pixel_index + 1] = 255;
        self.image_data[pixel_index + 2] = if state { 0 } else { 255 };

        // Update list
        let vector_index = (y + 1) * self.cols + x + 1;
        let source = if self.swap {
            &mut self.target
        } else {
            &mut self.source
        };

        source[vector_index] = state;
    }
}
