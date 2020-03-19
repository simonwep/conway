use getrandom::Error;

pub fn random_bool(limit: f32) -> bool {
    match random() {
        Ok(val) => val > limit,
        Err(_) => false,
    }
}

pub fn random() -> Result<f32, Error> {
    let mut buf = [0u8; 1];
    getrandom::getrandom(&mut buf)?;
    Ok(buf[0] as f32 / 255.0)
}
