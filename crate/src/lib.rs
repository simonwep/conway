extern crate js_sys;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
// Taken from https://github.com/rustwasm/wasm-pack-template/blob/master/src/lib.rs
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Universe {
    cols: usize,
    rows: usize,
    source: Vec<bool>,
    target: Vec<bool>,
    image_data: Vec<u8>,
    image_size: usize,
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
        // Bit-map with (r,g,b,a) values
        let pixels = (rows * cols) * 4;
        let mut image_data: Vec<u8> = (0..pixels).map(|_| 255 as u8).collect();

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
                if js_sys::Math::random() > 0.45 {
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
            image_size: pixels,
            resurrected_cells,
            image_data,
            cols,
            rows,
            source,
            target,
        }
    }

    /// Calculates the next generation
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

        let mut mask: u16 = 0;
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

    pub fn image_data(&mut self) -> *const u8 {
        self.image_data.as_ptr()
    }

    pub fn image_size(&self) -> usize {
        self.image_size
    }

    pub fn killed_cells(&mut self) -> u32 {
        self.killed_cells
    }

    pub fn resurrected_cells(&mut self) -> u32 {
        self.resurrected_cells
    }

    pub fn set_ruleset(&mut self, resurrect: u16, survive: u16) {
        self.resurrect_rules = resurrect;
        self.survive_rules = survive;
    }
}
