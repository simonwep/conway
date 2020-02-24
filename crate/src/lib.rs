extern crate js_sys;

use wasm_bindgen::prelude::*;

mod utils;

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
    killed_cells: Vec<(u32, u32)>,
    resurrected_cells: Vec<(u32, u32)>,
    swap: bool,
}

#[wasm_bindgen]
impl Universe {
    /// Creates a new game-of-life universe
    pub fn new(mut rows: usize, mut cols: usize) -> Universe {
        // Add padding
        cols += 2;
        rows += 2;

        let total_cells = cols * rows;
        let target: Vec<bool> = (0..total_cells).map(|_| false).collect();
        let mut source: Vec<bool> = (0..total_cells).map(|_| false).collect();

        let killed_cells = Vec::with_capacity(total_cells * 2 * 4);
        let mut resurrected_cells = Vec::with_capacity(total_cells * 2 * 4);

        // Update list of previously born cells
        for row in 1..(rows - 1) {
            let offset = row * cols;

            for col in 1..(cols - 1) {
                if js_sys::Math::random() > 0.45 {
                    source[offset + col] = true;
                    resurrected_cells.push(((row - 1) as u32, (col - 1) as u32))
                }
            }
        }

        Universe {
            swap: false,
            killed_cells,
            resurrected_cells,
            cols,
            rows,
            source,
            target,
        }
    }

    pub fn resurrected_cells(&mut self) -> *const (u32, u32) {
        self.resurrected_cells.as_ptr()
    }

    pub fn resurrected_cells_amount(&mut self) -> u32 {
        self.resurrected_cells.len() as u32
    }

    pub fn killed_cells(&mut self) -> *const (u32, u32) {
        self.killed_cells.as_ptr()
    }

    pub fn killed_cells_amount(&mut self) -> u32 {
        self.killed_cells.len() as u32
    }

    /// Calculates the next generation
    pub fn next_gen(&mut self) {
        let resurrected_cells = &mut self.resurrected_cells;
        let killed_cells = &mut self.killed_cells;
        resurrected_cells.truncate(0);
        killed_cells.truncate(0);

        let (src, tar) = if self.swap {
            (&mut self.target, &mut self.source)
        } else {
            (&mut self.source, &mut self.target)
        };

        // Swap source and target array
        self.swap = !self.swap;

        // Update inner cells, the padding is used to prevent out-of-bounds access:
        // O -> padding (always zero), X -> Cells which get updated
        // O O O O O
        // O X X X O
        // O X X X O
        // O O O O O
        for row in 1..(self.rows - 1) {
            let top = (row - 1) * self.cols + 1;
            let middle = row * self.cols + 1;
            let bottom = (row + 1) * self.cols + 1;

            // Build 3x3 bit mask, the mask contains the state of the three cells
            // Below and above the current row.
            // TL TM X << X will be updated at each iteration (and others shifted to left)
            // ML MM X
            // BL BM X
            let mut mask: u16 = (if src[top - 1] { 32 } else { 0 })
                + (if src[top] { 4 } else { 0 })
                + (if src[middle - 1] { 16 } else { 0 })
                + (if src[middle] { 2 } else { 0 })
                + (if src[bottom - 1] { 8 } else { 0 })
                + (if src[bottom] { 1 } else { 0 });

            for col in 1..(self.cols - 1) {
                // Shift previously saved information to the left and make room
                // For 3 additional bits (which will be used for the middle row).
                mask = ((mask << 3) & 0b111111111) + // Make room for three more bits
                    (if src[top + col] { 4 } else { 0 }) + // TR
                    (if src[middle + col] { 2 } else { 0 }) + // MR
                    (if src[bottom + col] { 1 } else { 0 }); // BR

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
                    // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
                    // Any live cell with two or three live neighbours lives on to the next generation.
                    // Any live cell with more than three live neighbours dies, as if by overpopulation.
                    neighbors < 4 && neighbors > 1
                } else {
                    // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    neighbors == 3
                };

                // Save state
                tar[cell_index] = next;

                // Check if cell has changed
                if cell != next {
                    let payload = ((row - 1) as u32, (col - 1) as u32);

                    // Save changed cell
                    match next {
                        true => resurrected_cells.push(payload),
                        false => killed_cells.push(payload),
                    };
                };
            }
        }
    }
}
