export interface Config {
  dify: {
    vision_api_url: string;
    chat_api_url: string;
    file_upload_url: string;
    api_key: string;
    vision_api_key: string;
  };
  settings: {
    check_interval: number;
    error_retry_interval: number;
    use_screenshot: boolean;
    cleanup_screenshots: boolean;
    cleanup_after_days: number;
    confidence_threshold: number;
    screenshot_delay: number;
    click_delay: number;
  };
  templates: {
    chat_window: string;
    input_box: string;
    send_button: string;
    new_message: string;
    transfer_button: string;
    close_chat: string;
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DifyResponse {
  answer: string;
  data?: any;
}

export interface FileUploadResponse {
  id: string;
}

export interface ChatResponse {
  reply: string;
  needHuman: boolean;
}
